'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useCart } from '@/lib/shop/cart'
import type { ShopProduct } from '@/lib/shop/products'

type Props = { product: ShopProduct }

export default function AddToCartButton({ product }: Props) {
  const addItem = useCart((s) => s.addItem)
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  const onClick = () => {
    setBusy(true)
    addItem({
      productId: product.id,
      productSlug: product.slug,
      productTitle: product.title,
      productType: product.type,
      unitPrice: product.price,
      quantity: 1,
      unitTemplates: product.unitTemplates,
    })
    router.push('/cart')
  }

  return (
    <button type="button" onClick={onClick} disabled={busy} className="shop-btn shop-btn--block">
      {busy ? 'Adding…' : 'Add to cart'}
      {!busy && (
        <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden>
          <path d="M1 5H13M13 5L9 1M13 5L9 9" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      )}
    </button>
  )
}
