import Link from 'next/link'
import { notFound } from 'next/navigation'
import { RichText } from '@payloadcms/richtext-lexical/react'
import PageHeader from '@/components/PageHeader/PageHeader'
import { getProductBySlug } from '@/lib/shop/products'
import { formatPrice } from '@/lib/shop/types'
import AddToCartButton from '@/components/Shop/AddToCartButton'
import '@/components/Shop/shop.css'

type Params = Promise<{ slug: string }>

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return { title: 'Product not found' }
  return { title: `${product.title} | Club Shop` }
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product || !product.active) notFound()

  return (
    <>
      <PageHeader pageName={product.title} />
      <section className="parent shop">
        <div style={{ marginBottom: 20 }}>
          <Link href="/shop" className="shop-link">
            ← Back to shop
          </Link>
        </div>
        <div className="pdp">
          <div
            className={`pdp__image${product.imageUrl ? '' : ' pdp__image--placeholder'}`}
            style={product.imageUrl ? { backgroundImage: `url(${product.imageUrl})` } : undefined}
          />
          <div className="pdp__body">
            <p className="pdp__kicker">
              {product.type === 'bundle' ? '— Club bundle' : '— Club item'}
            </p>
            <h2 className="pdp__title">{product.title}</h2>
            <div className="pdp__price-row">
              <span className="pdp__price shop__mono">{formatPrice(product.price)}</span>
              <span className="pdp__price-label">All in · VAT incl.</span>
            </div>
            {product.description ? (
              <div className="pdp__description">
                <RichText data={product.description as any} />
              </div>
            ) : null}
            {product.type === 'bundle' && product.unitTemplates.length > 0 && (
              <div className="pdp__includes">
                <p className="pdp__includes-label">What&apos;s included</p>
                <ul className="pdp__includes-list">
                  {product.unitTemplates
                    .filter((t) => t.productId !== product.id)
                    .map((t, i) => (
                      <li key={i}>{t.productTitle}</li>
                    ))}
                </ul>
              </div>
            )}
            <AddToCartButton product={product} />
          </div>
        </div>
      </section>
    </>
  )
}
