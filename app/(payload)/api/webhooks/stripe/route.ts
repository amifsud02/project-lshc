import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getPayload, type Payload } from 'payload'
import config from '@payload-config'
import { getStripe } from '@/lib/stripe/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    console.error('[stripe webhook] STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const rawBody = await req.text()

  let event: Stripe.Event
  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(rawBody, signature, secret)
  } catch (err) {
    console.error('[stripe webhook] signature verification failed', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const payload = await getPayload({ config })

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const registrationId = session.metadata?.nurseryRegistrationId
        if (registrationId) {
          await payload.update({
            collection: 'nursery-registrations',
            id: registrationId,
            data: {
              status: 'paid',
              paidAt: new Date().toISOString(),
              stripePaymentIntentId:
                typeof session.payment_intent === 'string' ? session.payment_intent : undefined,
            } as any,
          })
          break
        }
        const orderId = session.metadata?.orderId
        if (!orderId) break
        // Bank transfers and similar methods complete the session before the money arrives;
        // those orders are marked paid by checkout.session.async_payment_succeeded instead.
        if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') break
        await markOrderPaid(payload, orderId, session)
        break
      }
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session
        const orderId = session.metadata?.orderId
        if (orderId) await markOrderPaid(payload, orderId, session)
        break
      }
      case 'checkout.session.async_payment_failed': {
        const session = event.data.object as Stripe.Checkout.Session
        const orderId = session.metadata?.orderId
        if (orderId) await moveOrder(payload, orderId, ['pending'], { status: 'cancelled' })
        break
      }
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        const registrationId = session.metadata?.nurseryRegistrationId
        if (registrationId) {
          await payload.update({
            collection: 'nursery-registrations',
            id: registrationId,
            data: { status: 'cancelled' } as any,
          })
          break
        }
        const orderId = session.metadata?.orderId
        if (!orderId) break
        await moveOrder(payload, orderId, ['pending'], { status: 'cancelled' })
        break
      }
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        const pi = typeof charge.payment_intent === 'string' ? charge.payment_intent : null
        if (!pi) break
        const { docs } = await payload.find({
          collection: 'orders',
          where: { stripePaymentIntentId: { equals: pi } },
          limit: 1,
        })
        const order = docs[0]
        if (order) {
          // Stripe's running total of what's been refunded on this payment.
          await payload.update({ collection: 'orders', id: order.id, data: { refundedTotal: charge.amount_refunded } as any })
          // A partial refund leaves the order standing; only a full refund voids it.
          if (charge.refunded) await moveOrder(payload, String(order.id), ['paid', 'ready', 'shipped', 'fulfilled'], { status: 'refunded' })
          break
        }
        const { docs: registrations } = await payload.find({
          collection: 'nursery-registrations',
          where: { stripePaymentIntentId: { equals: pi } },
          limit: 1,
        })
        const registration = registrations[0]
        if (registration) {
          await payload.update({
            collection: 'nursery-registrations',
            id: registration.id,
            data: { status: 'refunded' } as any,
          })
        }
        break
      }
      default:
        break
    }
  } catch (err) {
    console.error('[stripe webhook] handler error', err)
    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

/**
 * Moves an order to a new status only from the statuses given, so a late or repeated event
 * (an expiry after payment, a duplicate delivery) can't undo a later state. Mirrors the
 * MEMBRS webhook. Returns whether the order was updated.
 */
async function moveOrder(
  payload: Payload,
  orderId: string,
  from: string[],
  data: Record<string, unknown> | ((order: any) => Record<string, unknown>),
): Promise<boolean> {
  const order = await payload.findByID({ collection: 'orders', id: orderId, depth: 0 }).catch(() => null)
  if (!order || !from.includes(String(order.status))) return false
  await payload.update({ collection: 'orders', id: orderId, data: (typeof data === 'function' ? data(order) : data) as any })
  return true
}

/** Marks an order paid with what Stripe actually charged, which a promotion code may lower. */
const markOrderPaid = (payload: Payload, orderId: string, session: Stripe.Checkout.Session) =>
  moveOrder(payload, orderId, ['pending'], (order) => {
    const charged = typeof session.amount_total === 'number' ? session.amount_total : undefined
    const discount = session.total_details?.amount_discount ?? 0
    const before = Number(order.total) || 0
    return {
      status: 'paid',
      paidAt: new Date().toISOString(),
      stripePaymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : undefined,
      ...(charged !== undefined && charged !== before
        ? {
            total: charged,
            discountTotal: discount,
            // VAT is inside the price, so it shrinks with the discount.
            vatIncluded: before > 0 ? Math.round(((Number(order.vatIncluded) || 0) * charged) / before) : 0,
          }
        : {}),
    }
  })
