import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Package, School, UserRound } from 'lucide-react'
import StatusBadge from '@/components/Account/StatusBadge'
import { getCurrentUser } from '@/lib/auth/server'
import { countUserRecords, formatDate, getUserOrders, orderStatusLabels } from '@/lib/account/data'
import { formatPrice } from '@/lib/shop/types'

export const metadata = { title: 'My account | La Salle Handball' }

export default async function AccountDashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?redirect=/account')

  const [counts, recentOrders] = await Promise.all([countUserRecords(user), getUserOrders(user, 3)])
  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email

  return (
    <>
      <h2 className="account-title">Dashboard</h2>
      <p className="account-lead account-hello">
        Hello <strong>{displayName}</strong> (not {displayName}?{' '}
        <Link href="/logout" prefetch={false}>Sign out</Link>)
      </p>
      <p className="account-lead">
        From your account dashboard you can view your{' '}
        <Link href="/account/orders">recent orders</Link>, check your{' '}
        <Link href="/account/nursery">nursery registrations</Link>, and edit your{' '}
        <Link href="/account/details">account details</Link>.
      </p>

      <div className="account-tiles">
        <Link href="/account/orders" className="account-tile">
          <Package aria-hidden="true" />
          <span className="account-tile__count">{counts.orders}</span>
          <span className="account-tile__label">{counts.orders === 1 ? 'Order' : 'Orders'}</span>
        </Link>
        <Link href="/account/nursery" className="account-tile">
          <School aria-hidden="true" />
          <span className="account-tile__count">{counts.nursery}</span>
          <span className="account-tile__label">
            Nursery {counts.nursery === 1 ? 'registration' : 'registrations'}
          </span>
        </Link>
        <Link href="/account/details" className="account-tile">
          <UserRound aria-hidden="true" />
          <span className="account-tile__count" style={{ fontSize: 18, lineHeight: 1.3 }}>
            {user.email}
          </span>
          <span className="account-tile__label">Account details</span>
        </Link>
      </div>

      {recentOrders.length > 0 ? (
        <section className="account-section">
          <div className="account-section__head">
            <h3 className="account-section__title">Recent orders</h3>
            <Link href="/account/orders" className="account-inline-link" style={{ fontSize: 13 }}>
              View all
            </Link>
          </div>
          <div className="account-table-wrap">
            <table className="account-table">
              <thead>
                <tr>
                  <th scope="col">Order</th>
                  <th scope="col">Date</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="is-num">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </>
  )
}
