'use server'

import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getStripe } from '@/lib/stripe/server'
import { getProductById } from '@/lib/shop/products'
import { formatPrice, hasBundleItems, isValidPhone, unitExtras, type CartItem, type CustomFieldDef } from '@/lib/shop/types'
import { StockDemand } from '@/lib/shop/stock'
import { canViewShop } from '@/lib/shop/access'
import { validateUnit } from '@/lib/shop/validation'
import { quote, type CouponTerms } from '@/lib/shop/pricing'
import { getStoreRulesUncached, validateCoupon } from '@/lib/shop/storeRules'

type Buyer = { email: string; firstName: string; lastName: string; phone: string }

type Fulfilment = {
  /** A shipping option from `quote()`. */
  optionId?: string
  country?: string
  addressLine1?: string
  addressLine2?: string
  locality?: string
  postcode?: string
  note?: string
}

type Input = {
  items: CartItem[]
  buyer: Buyer
  fulfilment: Fulfilment
  consent: { acceptTerms: boolean; marketingOptIn: boolean }
  couponCode?: string
}

const clean = (value: unknown, max = 200) => String(value ?? '').trim().slice(0, max)

type Result =
  | { ok: true; url: string }
  | { ok: false; error: string }

/**
 * Checks a coupon while the buyer is on the checkout page, so the summary can show the
 * discount. `createCheckoutSession` checks it again against the real cart.
 */
export async function checkCoupon(input: { code: string; subtotal: number; email: string }): Promise<{ ok: true; coupon: CouponTerms } | { ok: false; error: string }> {
  if (!(await canViewShop())) return { ok: false, error: 'The shop is currently unavailable.' }
  const payload = await getPayload({ config })
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email ?? '') ? input.email : ''
  return validateCoupon(payload, clean(input.code, 64), { subtotal: Math.max(0, Number(input.subtotal) || 0), email, formatPrice })
}

export async function createCheckoutSession(input: Input): Promise<Result> {
  const { items, buyer, consent } = input

  if (!(await canViewShop())) {
    return { ok: false, error: 'The shop is currently unavailable.' }
  }

  if (!buyer.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer.email)) {
    return { ok: false, error: 'A valid email is required.' }
  }
  if (!items.length) {
    return { ok: false, error: 'Your cart is empty.' }
  }
  if (!clean(buyer.firstName) || !clean(buyer.lastName)) {
    return { ok: false, error: 'Please enter your first and last name.' }
  }
  if (!isValidPhone(buyer.phone ?? '')) {
    return { ok: false, error: 'Please enter a valid mobile number.' }
  }
  if (!consent?.acceptTerms) {
    return { ok: false, error: 'Please accept the terms of sale to continue.' }
  }

  // Shipping options, coupons and tax: Store setup when configured, else Site Settings → Shop.
  const rules = await getStoreRulesUncached()
  const country = rules.countries.some((c) => c.value === input.fulfilment?.country) ? String(input.fulfilment.country) : rules.defaultCountry

  const stripe = getStripe()
  const payload = await getPayload({ config })

  const orderItems: Array<{
    productTitle: string
    product: string
    bundleParentLineId?: string
    membershipSeason?: string
    quantity: number
    unitPrice: number
    customFieldValues: Record<string, string>
  }> = []

  const stripeLineItems: Array<{
    price_data: {
      currency: string
      product_data: { name: string }
      unit_amount: number
    }
    quantity: number
  }> = []

  let subtotal = 0
  const demand = new StockDemand()
  const stockOf = new Map<string, { stock?: number; preorder?: unknown; customFields: CustomFieldDef[] }>()
  // Paid extras such as a printed name, charged as their own Stripe lines: "Club Hoodie · Name on back".
  const extras = new Map<string, { amount: number; count: number }>()
  const addExtras = (title: string, fields: CustomFieldDef[], values: Record<string, string>) => {
    for (const f of fields) {
      if (!f.surcharge || !String(values?.[f.name] ?? '').trim()) continue
      const key = `${title} · ${f.label}`
      const e = extras.get(key) ?? { amount: f.surcharge, count: 0 }
      e.count++
      extras.set(key, e)
    }
  }

  for (const item of items) {
    const product = await getProductById(item.productId)
    if (!product || !product.active) {
      return { ok: false, error: `"${item.productTitle}" is no longer available.` }
    }

    stockOf.set(product.id, { stock: product.stock, preorder: product.preorder, customFields: product.customFields })

    if (product.type === 'membership') {
      // Memberships are bought on their own product page and paid through MEMBRS.
      return { ok: false, error: `"${product.title}" is bought on its own. Please remove it from your cart and use "Buy membership" on its page.` }
    }

    if (hasBundleItems(product.type)) {
      // Units come from the browser, so check them against the product as it is
      // now: a stale or tampered cart must not skip any member's details.
      const unitsPerQty = product.unitTemplates.length
      if (item.units.length !== unitsPerQty * item.quantity) {
        return { ok: false, error: `"${product.title}" has changed since it was added. Please remove it and add it again.` }
      }
      for (let q = 0; q < item.quantity; q++) {
        // The first unit of each purchase carries the price; every included
        // product hangs off it at 0.
        let priced = false
        for (let u = 0; u < unitsPerQty; u++) {
          const template = product.unitTemplates[u]
          const unit = item.units[q * unitsPerQty + u]
          if (!unit || unit.productId !== template.productId) {
            return { ok: false, error: `"${product.title}" has changed since it was added. Please remove it and add it again.` }
          }
          const validationError = validateUnit({ customFields: template.customFields, values: unit.values })
          if (validationError) return { ok: false, error: `${product.title}: ${validationError}` }
          const isBundleSelf = unit.productId === product.id
          const carriesPrice = isBundleSelf && !priced
          if (carriesPrice) priced = true
          const extra = unitExtras({ customFields: template.customFields, values: unit.values ?? {} })
          addExtras(template.productTitle, template.customFields, unit.values ?? {})
          subtotal += extra
          demand.add(template.productId, template.productTitle, unit.values ?? {}, template.customFields)
          if (!stockOf.has(template.productId)) stockOf.set(template.productId, { customFields: template.customFields })
          orderItems.push({
            productTitle: template.productTitle,
            product: template.productId,
            bundleParentLineId: carriesPrice ? undefined : item.lineId,
            quantity: 1,
            unitPrice: (carriesPrice ? product.price : 0) + extra,
            customFieldValues: unit.values ?? {},
          })
        }
      }
      const totalForLine = product.price * item.quantity
      subtotal += totalForLine
      stripeLineItems.push({
        price_data: {
          currency: 'eur',
          product_data: { name: product.title },
          unit_amount: product.price,
        },
        quantity: item.quantity,
      })
    } else {
      for (const unit of item.units) {
        const validationError = validateUnit({ customFields: product.customFields, values: unit.values })
        if (validationError) return { ok: false, error: `${product.title}: ${validationError}` }
        const extra = unitExtras({ customFields: product.customFields, values: unit.values ?? {} })
        addExtras(product.title, product.customFields, unit.values ?? {})
        subtotal += extra
        demand.add(product.id, product.title, unit.values ?? {}, product.customFields)
        orderItems.push({
          productTitle: product.title,
          product: product.id,
          quantity: 1,
          unitPrice: product.price + extra,
          customFieldValues: unit.values ?? {},
        })
      }
      const totalForLine = product.price * item.quantity
      subtotal += totalForLine
      stripeLineItems.push({
        price_data: {
          currency: 'eur',
          product_data: { name: product.title },
          unit_amount: product.price,
        },
        quantity: item.quantity,
      })
    }
  }

  const short = demand.shortfall(stockOf)
  if (short) return { ok: false, error: `${short} Please change your cart and try again.` }

  let coupon: CouponTerms | null = null
  if (clean(input.couponCode)) {
    const checked = await validateCoupon(payload, clean(input.couponCode, 64), { subtotal, email: buyer.email, formatPrice })
    if (!checked.ok) return { ok: false, error: checked.error }
    coupon = checked.coupon
  }

  const units = items.reduce((sum, item) => sum + item.quantity, 0)
  const priced = quote({ rules, subtotal, units, country, optionId: input.fulfilment?.optionId, coupon, formatPrice })
  const option = priced.selected
  if (!option) return { ok: false, error: "Sorry, we don't ship to that country." }
  // E.g. free shipping that no longer applies because the cart changed: say so rather than charge more.
  if (input.fulfilment?.optionId && input.fulfilment.optionId !== option.id) {
    return { ok: false, error: 'That delivery option is no longer available for this order. Please choose another.' }
  }
  const method = option.method
  const fulfilment = {
    method,
    methodTitle: option.title,
    country,
    ...(method === 'deliver'
      ? {
          addressLine1: clean(input.fulfilment.addressLine1),
          addressLine2: clean(input.fulfilment.addressLine2),
          locality: clean(input.fulfilment.locality, 100),
          postcode: clean(input.fulfilment.postcode, 20),
        }
      : {}),
    note: clean(input.fulfilment?.note, 500) || undefined,
  }
  if (method === 'deliver' && (!fulfilment.addressLine1 || !fulfilment.locality)) {
    return { ok: false, error: 'Please enter the delivery address and locality.' }
  }
  const deliveryFee = priced.shipping
  const tax = priced.tax

  for (const [name, e] of extras) {
    stripeLineItems.push({ price_data: { currency: 'eur', product_data: { name }, unit_amount: e.amount }, quantity: e.count })
  }

  if (deliveryFee > 0) {
    stripeLineItems.push({
      price_data: { currency: 'eur', product_data: { name: option.title }, unit_amount: deliveryFee },
      quantity: 1,
    })
  }

  // Prices entered without tax: the tax is its own line.
  if (tax && !tax.inclusive && tax.amount > 0) {
    stripeLineItems.push({
      price_data: { currency: 'eur', product_data: { name: `${tax.name} (${tax.rate}%)` }, unit_amount: tax.amount },
      quantity: 1,
    })
  }

  // After a store coupon, before any Stripe promotion code; the webhook records what Stripe actually charged.
  const total = priced.total

  let currentUserId: string | undefined
  try {
    const reqHeaders = await headers()
    const { user } = await payload.auth({ headers: reqHeaders })
    if (user) currentUserId = String(user.id)
  } catch {
    currentUserId = undefined
  }

  const order = await payload.create({
    collection: 'orders',
    data: {
      status: 'pending',
      customerEmail: buyer.email,
      customerName: `${clean(buyer.firstName, 100)} ${clean(buyer.lastName, 100)}`,
      customerPhone: clean(buyer.phone, 30),
      user: currentUserId,
      fulfilment,
      consent: { termsAcceptedAt: new Date().toISOString(), marketingOptIn: Boolean(consent.marketingOptIn) },
      items: orderItems,
      subtotal,
      deliveryFee,
      discountTotal: priced.discount,
      couponCode: coupon?.code,
      vatIncluded: tax?.inclusive ? tax.amount : 0,
      taxAdded: tax && !tax.inclusive ? tax.amount : 0,
      total,
      currency: 'eur',
    } as any,
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

  let session: Awaited<ReturnType<typeof stripe.checkout.sessions.create>>
  try {
    // A store coupon becomes a one-off Stripe coupon for exactly the discount worked out above.
    // Stripe allows either discounts or promotion codes on a session, not both.
    const discount =
      priced.discount > 0
        ? await stripe.coupons.create({ amount_off: priced.discount, currency: 'eur', duration: 'once', max_redemptions: 1, name: `Coupon ${coupon!.code.toUpperCase()}` })
        : null
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      // No payment_method_types: Stripe offers whatever is switched on in the Dashboard,
      // including Apple Pay and Google Pay.
      line_items: stripeLineItems,
      ...(discount ? { discounts: [{ coupon: discount.id }] } : { allow_promotion_codes: true }),
      customer_email: buyer.email,
      metadata: { orderId: String(order.id), orderNumber: String(order.orderNumber ?? '') },
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout/cancel`,
    })
  } catch (err) {
    // Nothing was charged; don't leave a pending order behind.
    console.error('[checkout] Stripe session failed', err)
    await payload.update({ collection: 'orders', id: order.id, data: { status: 'cancelled' } as any })
    return { ok: false, error: "We couldn't open the payment page. Please try again in a moment." }
  }

  await payload.update({
    collection: 'orders',
    id: order.id,
    data: { stripeCheckoutSessionId: session.id } as any,
  })

  if (!session.url) {
    return { ok: false, error: 'Stripe did not return a checkout URL.' }
  }

  return { ok: true, url: session.url }
}
