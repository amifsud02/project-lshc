import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import StatusBadge from '@/components/Account/StatusBadge'
import { getCurrentUser } from '@/lib/auth/server'
import { formatDate, getUserOrder, orderStatusLabels } from '@/lib/account/data'
import { formatPrice } from '@/lib/shop/types'

type Params = Promise<{ orderNumber: string }>

export async function generateMetadata({ params }: { params: Params }) {
  const { orderNumber } = await params
  return { title: `Order #${orderNumber} | La Salle Handball` }
}

export default async function AccountOrderPage({ params }: { params: Params }) {
  const { orderNumber } = await params
  const user = await getCurrentUser()
  if (!user) redirect(`/login?redirect=/account/orders/${encodeURIComponent(orderNumber)}`)

  const order = await getUserOrder(user, orderNumber)
  if (!order) notFound()

  const items = order.items ?? []
  const currency = order.currency ?? 'eur'

  return (
    <>
      <p style={{ margin: '0 0 12px' }}>
        <Link href="/account/orders" className="account-inline-link" style={{ fontSize: 13 }}>
          ← Back to orders
        </Link>
      </p>
      <h2 className="account-title">Order #{order.orderNumber}</h2>

      <p className="account-order-meta">
        Order <strong>#{order.orderNumber}</strong> was placed on{' '}
        <strong>{formatDate(order.createdAt)}</strong> and is currently{' '}
        <StatusBadge status={order.status} label={orderStatusLabels[order.status]} />
        {order.paidAt ? (
          <>
            {' '}
            · Paid on <strong>{formatDate(order.paidAt)}</strong>
          </>
        ) : null}
      </p>

      <section className="account-section" style={{ marginTop: 0 }}>
        <div className="account-section__head">
          <h3 className="account-section__title">Order details</h3>
        </div>
        <div className="account-table-wrap">
          <table className="account-table">
            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col" className="is-num">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const isChild = Boolean(item.bundleParentLineId)
                const fields =
                  item.customFieldValues && typeof item.customFieldValues === 'object' && !Array.isArray(item.customFieldValues)
                    ? Object.entries(item.customFieldValues as Record<string, unknown>)
                    : []
                const lineTotal = (item.unitPrice ?? 0) * (item.quantity ?? 1)
                return (
                  <tr key={item.id ?? index}>
                    <td data-label="Product" style={isChild ? { paddingLeft: 32, color: 'var(--shop-muted)' } : undefined}>
                      <span style={{ fontWeight: isChild ? 500 : 700 }}>
                        {isChild ? '↳ ' : ''}
                        {item.productTitle}
                      </span>{' '}
                      <span style={{ color: 'var(--shop-muted)' }}>× {item.quantity ?? 1}</span>
                      {fields.length > 0 ? (
                        <ul className="account-item-fields">
                          {fields.map(([key, value]) => (
                            <li key={key}>
                              {key}: {String(value ?? '')}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </td>
                    <td data-label="Total" className="is-num">
                      {lineTotal > 0 ? formatPrice(lineTotal, currency) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <dl className="account-totals">
          <div>
            <dt>Subtotal</dt>
            <dd>{formatPrice(order.subtotal ?? order.total, currency)}</dd>
          </div>
          <div>
            <dt>Total</dt>
            <dd>{formatPrice(order.total, currency)}</dd>
          </div>
        </dl>
      </section>

      <section className="account-section">
        <div className="account-section__head">
          <h3 className="account-section__title">Customer details</h3>
        </div>
        <dl className="account-dl">
          <div>
            <dt>Email</dt>
            <dd>{order.customerEmail}</dd>
          </div>
          {order.customerName ? (
            <div>
              <dt>Name</dt>
              <dd>{order.customerName}</dd>
            </div>
          ) : null}
          {order.customerPhone ? (
            <div>
              <dt>Phone</dt>
              <dd>{order.customerPhone}</dd>
            </div>
          ) : null}
        </dl>
      </section>
    </>
  )
}
