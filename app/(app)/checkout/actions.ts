'use server'

import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getStripe } from '@/lib/stripe/server'
import { getProductById } from '@/lib/shop/products'
import { hasBundleItems, isValidPhone, unitExtras, type CartItem, type CustomFieldDef } from '@/lib/shop/types'
import { StockDemand } from '@/lib/shop/stock'
import { canViewShop } from '@/lib/shop/access'
import { validateUnit } from '@/lib/shop/validation'
import { deliveryFeeFor, vatIncluded, type FulfilmentMethod } from '@/lib/shop/settings'
import { getGeneralGlobal } from '@/lib/utils/payload/globals'

type Buyer = { email: string; firstName: string; lastName: string; phone: string }

type Fulfilment = {
  method: FulfilmentMethod
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
}

const clean = (value: unknown, max = 200) => String(value ?? '').trim().slice(0, max)

type Result =
  | { ok: true; url: string }
  | { ok: false; error: string }

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

  // Delivery is only offered while it's switched on in Site Settings; otherwise it's collection.
  const { shop } = await getGeneralGlobal()
  const method: FulfilmentMethod = input.fulfilment?.method === 'deliver' && shop.delivery.enabled ? 'deliver' : 'collect'
  const fulfilment = {
    method,
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
  const deliveryFee = deliveryFeeFor(method, shop)

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

  for (const [name, e] of extras) {
    stripeLineItems.push({ price_data: { currency: 'eur', product_data: { name }, unit_amount: e.amount }, quantity: e.count })
  }

  if (deliveryFee > 0) {
    stripeLineItems.push({
      price_data: { currency: 'eur', product_data: { name: 'Delivery' }, unit_amount: deliveryFee },
      quantity: 1,
    })
  }

  // Before any promotion code; the webhook records what Stripe actually charged.
  const total = subtotal + deliveryFee

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
      vatIncluded: vatIncluded(total, shop.vatRate),
      total,
      currency: 'eur',
    } as any,
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

  let session: Awaited<ReturnType<typeof stripe.checkout.sessions.create>>
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      // No payment_method_types: Stripe offers whatever is switched on in the Dashboard,
      // including Apple Pay and Google Pay.
      line_items: stripeLineItems,
      allow_promotion_codes: true,
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
