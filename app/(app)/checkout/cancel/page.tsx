import Link from 'next/link'
import PageHeader from '@/components/PageHeader/PageHeader'
import '@/components/Shop/shop.css'

export const metadata = { title: 'Payment cancelled' }

export default function CancelPage() {
  return (
    <>
      <PageHeader pageName="Payment cancelled" />
      <section className="parent shop">
        <p className="shop__intro">
          Your payment wasn&apos;t completed. Your cart is still saved, so you can pick up right where
          you left off.
        </p>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 16 }}>
          <Link href="/cart" className="shop-btn">
            Back to cart
          </Link>
          <Link href="/shop" className="shop-btn shop-btn--ghost">
            Keep browsing
          </Link>
        </div>
      </section>
    </>
  )
}
