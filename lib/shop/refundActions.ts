'use server'

import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { hasRole } from '@/lib/auth/roles'
import { getStripe } from '@/lib/stripe/server'

const REFUNDABLE = ['paid', 'ready', 'shipped', 'fulfilled']

/**
 * Refunds part or all of a club-shop order through Stripe. Admins only. The Stripe webhook
 * (charge.refunded) then records the refunded amount and, for a full refund, marks the order
 * refunded, which emails the buyer.
 */
export async function refundOrder(orderId: string, amountCents: number): Promise<{ ok: boolean; message: string }> {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user || !hasRole(user as any, 'admin')) return { ok: false, message: 'Only admins can refund orders.' }

  const order: any = await payload.findByID({ collection: 'orders', id: orderId, depth: 0 }).catch(() => null)
  if (!order) return { ok: false, message: 'Order not found.' }
  if (order.paymentProvider !== 'club' || !order.stripePaymentIntentId) {
    return { ok: false, message: 'This order was not paid through the club’s Stripe. Refund it where it was paid (e.g. Rypple).' }
  }
  if (!REFUNDABLE.includes(order.status)) return { ok: false, message: `A ${order.status} order can't be refunded.` }

  const left = (Number(order.total) || 0) - (Number(order.refundedTotal) || 0)
  const amount = Math.round(amountCents)
  if (!(amount > 0) || amount > left) {
    return { ok: false, message: `Enter an amount between €0.01 and €${(left / 100).toFixed(2)}.` }
  }

  try {
    await getStripe().refunds.create(
      { payment_intent: order.stripePaymentIntentId, amount, metadata: { orderId: String(order.id), refundedBy: String(user.email ?? user.id) } },
      // The same refund clicked twice is only made once.
      { idempotencyKey: `refund-${order.id}-${(Number(order.refundedTotal) || 0) + amount}` },
    )
  } catch (err: any) {
    payload.logger.error({ err, msg: `[refund] Stripe refused refund for ${order.orderNumber}` })
    return { ok: false, message: `Stripe didn't make the refund: ${err?.message ?? 'unknown error'}` }
  }
  return {
    ok: true,
    message: `Refund of €${(amount / 100).toFixed(2)} sent to Stripe. The order updates when Stripe confirms it, usually within a minute.`,
  }
}
