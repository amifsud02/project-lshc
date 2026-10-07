'use server'

import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getStripe } from '@/lib/stripe/server'
import { getProductById } from '@/lib/shop/products'
import type { CartItem } from '@/lib/shop/types'
import { canViewShop } from '@/lib/shop/access'

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
  if (!items.length) {
    return { ok: false, error: 'Your cart is empty.' }
  }

  const stripe = getStripe()
  const payload = await getPayload({ config })

  const orderItems: Array<{
    productTitle: string
    product: string
    bundleParentLineId?: string
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

    if (product.type === 'bundle') {
      const unitsPerQty = item.units.length / Math.max(1, item.quantity)
      for (let q = 0; q < item.quantity; q++) {
        for (let u = 0; u < unitsPerQty; u++) {
          const unit = item.units[q * unitsPerQty + u]
          if (!unit) continue
          const validationError = validateUnit(unit)
          if (validationError) return { ok: false, error: `${product.title}: ${validationError}` }
          const isBundleSelf = unit.productId === product.id
          orderItems.push({
            productTitle: unit.productTitle,
            product: unit.productId,
            bundleParentLineId: isBundleSelf ? undefined : item.lineId,
            quantity: 1,
            unitPrice: isBundleSelf ? product.price : 0,
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
        const validationError = validateUnit(unit)
        if (validationError) return { ok: false, error: `${product.title}: ${validationError}` }
        orderItems.push({
          productTitle: product.title,
          product: product.id,
          quantity: 1,
          unitPrice: product.price,
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

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: stripeLineItems,
    customer_email: buyer.email,
    metadata: { orderId: String(order.id), orderNumber: String(order.orderNumber ?? '') },
    success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/checkout/cancel`,
  })

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

function validateUnit(unit: {
  customFields: { name: string; label: string; kind: string; required: boolean }[]
  values: Record<string, string>
}): string | null {
  for (const field of unit.customFields) {
    const value = unit.values?.[field.name]
    if (field.required && (!value || String(value).trim() === '')) {
      return `missing "${field.label}"`
    }
    if (value && field.kind === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return `invalid email in "${field.label}"`
    }
  }
  return null
}
