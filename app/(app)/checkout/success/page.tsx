import Link from 'next/link'
import PageHeader from '@/components/PageHeader/PageHeader'
import { getPayload } from 'payload'
import config from '@payload-config'
import ClearCartOnMount from './ClearCartOnMount'
import { formatPrice } from '@/lib/shop/types'
import '@/components/Shop/shop.css'

export const metadata = { title: 'Order confirmed | La Salle Handball' }

type SearchParams = Promise<{ session_id?: string }>

export default async function SuccessPage({ searchParams }: { searchParams: SearchParams }) {
  const { session_id: sessionId } = await searchParams

  let order: any = null
  if (sessionId) {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'orders',
      where: { stripeCheckoutSessionId: { equals: sessionId } },
      limit: 1,
      overrideAccess: true,
    })
    order = docs[0] ?? null
  }

  return (
    <>
      <PageHeader pageName="Order confirmed" />
      <section className="parent shop">
        <ClearCartOnMount />
        <p className="shop__intro">
          Your support means the world to the club. A receipt has been sent to your email — you can
          close this page safely.
        </p>

        {order ? (
          <div className="receipt">
            <span className="receipt__stamp">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path
                  d="M2 7l3.2 3.2L12 3.4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="square"
                />
              </svg>
              Paid ·{' '}
              {new Date().toLocaleDateString('en-MT', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </span>
            <p className="receipt__order shop__mono">Order № {order.orderNumber}</p>
            <p className="receipt__email">
              Receipt sent to <strong>{order.customerEmail}</strong>
            </p>
            <ul className="receipt__table">
              {(order.items ?? []).map((it: any, i: number) => {
                const isChild = Boolean(it.bundleParentLineId)
                return (
                  <li key={i} className={`receipt__row${isChild ? ' receipt__row--child' : ''}`}>
                    <span className="receipt__row-title">
                      {it.productTitle} × {it.quantity}
                    </span>
                    <span className="receipt__row-amount shop__mono">
                      {it.unitPrice > 0 ? formatPrice(it.unitPrice * it.quantity) : ''}
                    </span>
                  </li>
                )
              })}
            </ul>
            <div className="receipt__total">
              <span>Total</span>
              <span className="receipt__total-amount shop__mono">{formatPrice(order.total)}</span>
            </div>
            <div style={{ marginTop: 28, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <Link href="/shop" className="shop-btn">
                Continue shopping
              </Link>
              <Link href="/account" className="shop-btn shop-btn--ghost">
                View orders
              </Link>
            </div>
          </div>
        ) : (
          <div className="receipt">
            <span className="receipt__stamp">Processing</span>
            <p className="receipt__order">We&apos;re confirming your payment…</p>
            <p className="receipt__email">
              If this page doesn&apos;t update in a moment, check your email for the receipt.
            </p>
            <div style={{ marginTop: 16 }}>
              <Link href="/shop" className="shop-btn">
                Continue shopping
              </Link>
            </div>
          </div>
        )}
      </section>
    </>
  )
}
