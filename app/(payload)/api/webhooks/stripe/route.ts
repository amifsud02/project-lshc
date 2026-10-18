import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getPayload } from 'payload'
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

  // Stripe redelivers events and doesn't guarantee their order, so each one only moves a
  // record forward from the status it expects; anything else (e.g. a late "completed" for an
  // order staff already fulfilled or refunded) is left alone.
  const advance = async (
    collection: 'orders' | 'nursery-registrations',
    id: string,
    from: string[],
    data: Record<string, unknown>,
  ) => {
    const doc = await payload.findByID({ collection, id, depth: 0 }).catch(() => null)
    if (!doc) {
      console.warn(`[stripe webhook] ${collection} ${id} not found for ${event.type}`)
      return
    }
    if (!from.includes(String((doc as any).status))) return
    await payload.update({ collection, id, data: data as any })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        // Only card payments are offered, so the money has arrived by now; anything else is not ours to confirm.
        if (session.payment_status !== 'paid') break
        const paid = {
          status: 'paid',
          paidAt: new Date().toISOString(),
          stripePaymentIntentId:
            typeof session.payment_intent === 'string' ? session.payment_intent : undefined,
        }
        const registrationId = session.metadata?.nurseryRegistrationId
        if (registrationId) {
          await advance('nursery-registrations', registrationId, ['pending'], paid)
          break
        }
        const orderId = session.metadata?.orderId
        if (!orderId) break
        await advance('orders', orderId, ['pending'], paid)
        break
      }
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        const registrationId = session.metadata?.nurseryRegistrationId
        if (registrationId) {
          await advance('nursery-registrations', registrationId, ['pending'], { status: 'cancelled' })
          break
        }
        const orderId = session.metadata?.orderId
        if (!orderId) break
        await advance('orders', orderId, ['pending'], { status: 'cancelled' })
        break
      }
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        // Also sent for partial refunds, which staff handle by hand: only a full refund voids the order.
        if (!charge.refunded) break
        const pi = typeof charge.payment_intent === 'string' ? charge.payment_intent : null
        if (!pi) break
        const { docs } = await payload.find({
          collection: 'orders',
          where: { stripePaymentIntentId: { equals: pi } },
          limit: 1,
        })
        const order = docs[0]
        if (order) {
          await advance('orders', String(order.id), ['paid', 'fulfilled'], { status: 'refunded' })
          break
        }
        const { docs: registrations } = await payload.find({
          collection: 'nursery-registrations',
          where: { stripePaymentIntentId: { equals: pi } },
          limit: 1,
        })
        const registration = registrations[0]
        if (registration) {
          await advance('nursery-registrations', String(registration.id), ['paid'], { status: 'refunded' })
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
