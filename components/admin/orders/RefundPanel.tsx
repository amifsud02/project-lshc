import type { UIFieldServerComponent } from 'payload'
import { hasRole } from '@/lib/auth/roles'
import { formatPrice } from '@/lib/shop/types'
import { RefundButton } from './RefundButton'

const REFUNDABLE = ['paid', 'ready', 'shipped', 'fulfilled']

/** Sidebar panel on a paid club-shop order: what's been refunded, and a refund control for admins. */
export const RefundPanel: UIFieldServerComponent = ({ data, req }) => {
  if (!data?.id || data.paymentProvider !== 'club' || !data.stripePaymentIntentId) return null
  const total = Number(data.total) || 0
  const refunded = Number(data.refundedTotal) || 0
  const left = total - refunded
  const canRefund = REFUNDABLE.includes(data.status) && left > 0 && hasRole(req.user as any, 'admin')

  return (
    <div style={{ border: '1px solid var(--theme-elevation-150)', borderRadius: 'var(--style-radius-m)', padding: 16, marginBottom: 24 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>Refunds</div>
      <div style={{ color: 'var(--theme-elevation-500)', marginBottom: canRefund ? 12 : 0 }}>
        {refunded > 0 ? `${formatPrice(refunded)} of ${formatPrice(total)} refunded` : 'Nothing refunded'}
      </div>
      {canRefund && <RefundButton orderId={String(data.id)} maxCents={left} />}
    </div>
  )
}
