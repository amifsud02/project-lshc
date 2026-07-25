import Link from 'next/link'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/PageHeader/PageHeader'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUser } from '@/lib/auth/server'
import { formatPrice } from '@/lib/shop/types'
import '@/components/Shop/shop.css'

export const metadata = { title: 'Account | La Salle Handball' }

export default async function AccountPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?redirect=/account')

  const payload = await getPayload({ config })
  const { docs: orders } = await payload.find({
    collection: 'orders',
    where: {
      or: [{ user: { equals: user.id } }, { customerEmail: { equals: user.email } }],
    },
    sort: '-createdAt',
    limit: 50,
    overrideAccess: true,
  })

  return (
    <>
      <PageHeader pageName="My account" />
      <section className="parent shop">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: 16,
            flexWrap: 'wrap',
            marginBottom: 24,
          }}
        >
          <div>
            <p
              style={{
                fontFamily: 'Montserrat, sans-serif',
                fontSize: 11,
                letterSpacing: '0.26em',
                textTransform: 'uppercase',
                fontWeight: 600,
                color: 'var(--shop-accent)',
                margin: 0,
              }}
            >
              Signed in as
            </p>
            <p
              style={{
                fontFamily: 'Raleway, sans-serif',
                fontSize: 20,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
                margin: '4px 0 0',
              }}
            >
              {[user.firstName, user.lastName].filter(Boolean).join(' ') || user.email}
            </p>
            <p
              style={{
                fontFamily: 'Montserrat, sans-serif',
                fontSize: 13,
                color: 'var(--shop-muted)',
                margin: '2px 0 0',
              }}
            >
              {user.email}
            </p>
          </div>
          <Link href="/logout" prefetch={false} className="shop-link">
            Sign out
          </Link>
        </div>

        <div className="shop__section-head">
          <h2>Order history</h2>
          <span className="shop__section-head-meta">
            {orders.length.toString().padStart(2, '0')} record
            {orders.length === 1 ? '' : 's'}
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state__eyebrow">No orders yet</p>
            <h3 className="empty-state__title">Your history is empty</h3>
            <p className="empty-state__body">
              Pick something up from the shop — your orders will appear here.
            </p>
            <Link href="/shop" className="shop-link">
              Browse the shop
            </Link>
          </div>
        ) : (
          <ul className="orders-list">
            {orders.map((o: any) => (
              <li key={o.id} className="orders-list__item">
                <div>
                  <p
                    className="shop__mono"
                    style={{
                      margin: 0,
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      fontSize: 14,
                    }}
                  >
                    № {o.orderNumber}
                  </p>
                  <p
                    className="shop__mono"
                    style={{
                      margin: '6px 0 0',
                      fontSize: 11,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: 'var(--shop-muted)',
                    }}
                  >
                    {new Date(o.createdAt).toLocaleDateString('en-MT', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}{' '}
                    · {o.items?.length ?? 0} item{o.items?.length === 1 ? '' : 's'}
                  </p>
                </div>
                <div
                  style={{
                    textAlign: 'right',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <span
                    className="shop__mono"
                    style={{ fontWeight: 700, fontSize: 16, color: 'var(--shop-ink)' }}
                  >
                    {formatPrice(o.total)}
                  </span>
                  <span className={`order-badge order-badge--${o.status}`}>{o.status}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
