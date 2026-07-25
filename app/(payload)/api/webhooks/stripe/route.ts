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

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const orderId = session.metadata?.orderId
        if (!orderId) break
        await payload.update({
          collection: 'orders',
          id: orderId,
          data: {
            status: 'paid',
            paidAt: new Date().toISOString(),
            stripePaymentIntentId:
              typeof session.payment_intent === 'string' ? session.payment_intent : undefined,
          } as any,
        })
        break
      }
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        const orderId = session.metadata?.orderId
        if (!orderId) break
        await payload.update({
          collection: 'orders',
          id: orderId,
          data: { status: 'cancelled' } as any,
        })
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
          await payload.update({
            collection: 'orders',
            id: order.id,
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
