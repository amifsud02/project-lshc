import { Info } from 'lucide-react'
import type { PriceChange } from '@/lib/shop/cart'
import { formatPrice } from '@/lib/shop/types'

/** Tells the buyer which cart lines were re-priced or removed since they added them. */
export default function PriceChanges({ changes }: { changes: PriceChange[] }) {
  if (changes.length === 0) return null
  return (
    <div role="status" className="flex gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <Info className="mt-0.5 size-4 shrink-0" />
      <ul className="flex flex-col gap-1">
        {changes.map((c) => (
          <li key={c.title}>
            {c.to === null ? (
              <>
                <strong>{c.title}</strong> is no longer available and was removed from your cart.
              </>
            ) : (
              <>
                <strong>{c.title}</strong> is now {formatPrice(c.to)} (was {formatPrice(c.from)}).
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
