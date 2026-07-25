import Link from 'next/link'
import type { ShopProduct } from '@/lib/shop/products'
import { formatPrice } from '@/lib/shop/types'

type Props = {
  product: ShopProduct
  index?: number
}

export default function ProductCard({ product, index }: Props) {
  const indexLabel = typeof index === 'number' ? String(index + 1).padStart(2, '0') : null

  return (
    <Link href={`/shop/${product.slug}`} className="product-card">
      {indexLabel && <span className="product-card__index">N° {indexLabel}</span>}
      {product.type === 'bundle' && <span className="product-card__badge">Bundle</span>}
      <div
        className={`product-card__image${product.imageUrl ? '' : ' product-card__image--placeholder'}`}
        style={product.imageUrl ? { backgroundImage: `url(${product.imageUrl})` } : undefined}
      />
      <div className="product-card__body">
        <span className="product-card__kicker">
          {product.type === 'bundle' ? 'Club bundle' : 'Club item'}
        </span>
        <h3 className="product-card__title">{product.title}</h3>
        <span className="product-card__price">{formatPrice(product.price)}</span>
        <span className="product-card__arrow">
          View
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden>
            <path d="M1 5H13M13 5L9 1M13 5L9 9" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </span>
      </div>
    </Link>
  )
}
