import { getPayload } from 'payload'
import config from '@payload-config'
import { verifyMembrsWebhook } from '@/lib/membrs/client'

/**
 * MEMBRS tells us when a membership order is paid, refunded or abandoned. Updating the order's
 * status runs the usual Orders hooks: a paid order fills the member register and emails a receipt.
 */
export async function POST(req: Request) {
  const raw = await req.text()
  const event = verifyMembrsWebhook(raw, req.headers.get('membrs-signature'))
  if (!event) return new Response('Invalid signature', { status: 400 })

  const status = {
    'membership.purchased': 'paid',
    'membership.refunded': 'refunded',
    'checkout.expired': 'cancelled',
  }[event.type]
  if (!status || !event.data.reference) return Response.json({ ignored: true })

  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'orders',
    where: { orderNumber: { equals: event.data.reference } },
    limit: 1,
    overrideAccess: true,
  })
  const order = docs[0]
  if (!order || (order as any).stripeCheckoutSessionId !== event.data.id) {
    // Unknown order: acknowledge so MEMBRS doesn't keep retrying something we can't match.
    console.warn('[membrs] webhook for unknown order', event.data.reference)
    return Response.json({ ignored: true })
  }

  // Redeliveries are harmless: only move forward from the state each event expects.
  const expected = event.type === 'membership.refunded' ? ['paid', 'fulfilled'] : ['pending']
  if (expected.includes(order.status as string)) {
    await payload.update({
      collection: 'orders',
      id: order.id,
      data: { status, ...(status === 'paid' ? { paidAt: new Date().toISOString() } : {}) } as any,
      overrideAccess: true,
    })
  }

  return Response.json({ received: true })
}
