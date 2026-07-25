import PageHeader from '@/components/PageHeader/PageHeader'
import { getActiveProducts } from '@/lib/shop/products'
import ProductCard from '@/components/Shop/ProductCard'
import '@/components/Shop/shop.css'

export const metadata = { title: 'Shop | La Salle Handball' }

export default async function ShopPage() {
  const products = await getActiveProducts()
  const now = new Date()
  const season = `${now.getFullYear()}/${String((now.getFullYear() + 1) % 100).padStart(2, '0')}`

  return (
    <>
      <PageHeader pageName="Shop" />
      <section className="parent shop">
        <p className="shop__intro">
          Memberships, kit and bundles worn on and off the court. Every purchase supports the next
          generation of La Salle handball.
        </p>

        <div className="shop__section-head">
          <h2>The collection</h2>
          <span className="shop__section-head-meta">
            Season {season} · {products.length.toString().padStart(2, '0')} item
            {products.length === 1 ? '' : 's'}
          </span>
        </div>

        {products.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state__eyebrow">Restocking</p>
            <h3 className="empty-state__title">The shop is being prepared</h3>
            <p className="empty-state__body">
              New kit and memberships will be published here soon. Check back shortly.
            </p>
          </div>
        ) : (
          <div className="shop__grid">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
