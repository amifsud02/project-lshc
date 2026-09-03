import Link from 'next/link'
import { redirect } from 'next/navigation'
import StatusBadge from '@/components/Account/StatusBadge'
import { getCurrentUser } from '@/lib/auth/server'
import { formatDate, getUserOrders, orderStatusLabels } from '@/lib/account/data'
import { formatPrice } from '@/lib/shop/types'

export const metadata = { title: 'Orders | La Salle Handball' }

export default async function AccountOrdersPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?redirect=/account/orders')

  const orders = await getUserOrders(user)

  return (
    <>
      <h2 className="account-title">Orders</h2>
      <p className="account-lead">
        Everything you have bought from the club shop, with the newest first.
      </p>

      {orders.length === 0 ? (
        <div className="account-empty">
          <p className="account-empty__title">No orders yet</p>
          <p className="account-empty__body">When you buy something from the shop it will show up here.</p>
          <Link href="/shop" className="shop-btn">
            Browse the shop
          </Link>
        </div>
      ) : (
        <div className="account-table-wrap">
          <table className="account-table">
            <thead>
              <tr>
                <th scope="col">Order</th>
                <th scope="col">Date</th>
                <th scope="col">Status</th>
                <th scope="col" className="is-num">Total</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const count = order.items?.filter((i) => !i.bundleParentLineId).length ?? 0
                return (
                  <tr key={order.id}>
                    <td data-label="Order">
                      <Link href={`/account/orders/${order.orderNumber}`} className="account-table__ref">
                        #{order.orderNumber}
                      </Link>
                    </td>
                    <td data-label="Date">{formatDate(order.createdAt)}</td>
                    <td data-label="Status">
                      <StatusBadge status={order.status} label={orderStatusLabels[order.status]} />
                    </td>
                    <td data-label="Total" className="is-num">
                      {formatPrice(order.total, order.currency)}
                      <span className="account-table__sub">
                        for {count} item{count === 1 ? '' : 's'}
                      </span>
                    </td>
                    <td data-label="" className="is-actions">
                      <Link href={`/account/orders/${order.orderNumber}`} className="shop-btn shop-btn--ghost">
                        View
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
