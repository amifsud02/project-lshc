'use server'

import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getStripe } from '@/lib/stripe/server'
import { getProductById } from '@/lib/shop/products'
import { hasBundleItems, isValidPhone, type CartItem } from '@/lib/shop/types'
import { canViewShop } from '@/lib/shop/access'
import { cleanUnitValues, validateUnit } from '@/lib/shop/validation'

/** Generous for a club shop, and keeps a tampered cart from creating huge orders. */
const MAX_LINES = 50
const MAX_QUANTITY = 50

type Buyer = { email: string; name: string; phone: string }

type Input = {
  items: CartItem[]
  buyer: Buyer
}

type Result =
  | { ok: true; url: string }
  | { ok: false; error: string }

export async function createCheckoutSession(input: Input): Promise<Result> {
  const { items, buyer } = input

  if (!(await canViewShop())) {
    return { ok: false, error: 'The shop is currently unavailable.' }
  }

  if (!buyer.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer.email)) {
    return { ok: false, error: 'A valid email is required.' }
  }
  if (!Array.isArray(items) || !items.length) {
    return { ok: false, error: 'Your cart is empty.' }
  }
  if (items.length > MAX_LINES) {
    return { ok: false, error: 'Your cart has too many items. Please split it into smaller orders.' }
  }

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

  for (const item of items) {
    const product = await getProductById(item.productId)
    if (!product || !product.active) {
      return { ok: false, error: `"${item.productTitle}" is no longer available.` }
    }

    // Quantity and units come from the browser: Stripe charges per quantity, while the order
    // records one line per unit, so the two must agree or a buyer could pay for one and get many.
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_QUANTITY) {
      return { ok: false, error: `"${product.title}" has an invalid quantity.` }
    }
    if (!Array.isArray(item.units)) {
      return { ok: false, error: `"${product.title}" has changed since it was added. Please remove it and add it again.` }
    }

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
          orderItems.push({
            productTitle: template.productTitle,
            product: template.productId,
            bundleParentLineId: carriesPrice ? undefined : item.lineId,
            quantity: 1,
            unitPrice: carriesPrice ? product.price : 0,
            customFieldValues: cleanUnitValues(template.customFields, unit.values),
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
      if (item.units.length !== item.quantity || item.units.some((u) => u?.productId !== product.id)) {
        return { ok: false, error: `"${product.title}" has changed since it was added. Please remove it and add it again.` }
      }
      for (const unit of item.units) {
        const validationError = validateUnit({ customFields: product.customFields, values: unit.values })
        if (validationError) return { ok: false, error: `${product.title}: ${validationError}` }
        orderItems.push({
          productTitle: product.title,
          product: product.id,
          quantity: 1,
          unitPrice: product.price,
          customFieldValues: cleanUnitValues(product.customFields, unit.values),
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

  if (buyer.phone && !isValidPhone(buyer.phone)) {
    return { ok: false, error: 'Please enter a valid mobile number.' }
  }

  const total = subtotal

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
      customerName: buyer.name || undefined,
      customerPhone: buyer.phone || undefined,
      user: currentUserId,
      items: orderItems,
      subtotal,
      total,
      currency: 'eur',
    } as any,
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: stripeLineItems,
      customer_email: buyer.email,
      metadata: { orderId: String(order.id), orderNumber: String(order.orderNumber ?? '') },
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout/cancel`,
    })
    if (!session.url) throw new Error('Stripe did not return a checkout URL')

    await payload.update({
      collection: 'orders',
      id: order.id,
      data: { stripeCheckoutSessionId: session.id } as any,
    })

    return { ok: true, url: session.url }
  } catch (err) {
    // Don't leave a pending order behind that can never be paid.
    await payload.update({ collection: 'orders', id: order.id, data: { status: 'cancelled' } as any })
    console.error('[checkout] could not create the Stripe session', err)
    return { ok: false, error: 'We could not start the payment. Please try again.' }
  }
}
