'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowRight, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
    <Button
      type="button"
      size="lg"
      onClick={onClick}
      disabled={busy}
      className="h-12 w-full cursor-pointer rounded-lg text-base font-medium"
    >
      {busy ? (
        'Adding…'
      ) : (
        <>
          <ShoppingCart />
          Add to cart
          <ArrowRight />
        </>
      )}
    </Button>
  )
}
