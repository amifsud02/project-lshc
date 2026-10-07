import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ShopProduct } from '@/lib/shop/products'
import { formatPrice } from '@/lib/shop/types'

type Props = {
  product: ShopProduct
}

export default function ProductCard({ product }: Props) {
  return (
    <Link href={`/shop/${product.slug}`} className="group flex flex-col gap-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-muted">
        {product.imageUrl ? (
          <div
            className="size-full bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
            style={{ backgroundImage: `url(${product.imageUrl})` }}
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary to-foreground text-4xl font-extrabold tracking-wide text-primary-foreground/80">
            LS
          </div>
        )}
        {product.type !== 'single' && (
          <Badge className="absolute left-4 top-4 rounded-full bg-background/90 px-2.5 py-0.5 text-xs text-primary">
            {product.type === 'membership' ? 'Membership' : 'Bundle'}
          </Badge>
        )}
      </div>
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-base font-semibold text-foreground">{product.title}</h3>
          <p className="text-base font-medium text-muted-foreground">
            {formatPrice(product.price)}
          </p>
        </div>
        <span
          className={cn(
            buttonVariants({ size: 'icon-sm' }),
            'size-8 shrink-0 rounded-full transition-colors group-hover:bg-primary/80'
          )}
          aria-hidden
        >
          <ArrowUpRight />
        </span>
      </div>
    </Link>
  )
}
