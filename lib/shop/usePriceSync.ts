'use client'

import { useEffect, useRef, useState } from 'react'
import { getCurrentPrices } from '@/app/(app)/cart/actions'
import { useCart, type PriceChange } from './cart'
import { priceKey } from './types'

/**
 * Re-reads the cart's prices from the server once the saved cart has loaded, so the total the
 * buyer sees is the one checkout charges. Returns the lines whose price changed or that were
 * removed because they're no longer on sale.
 */
export function usePriceSync(ready: boolean): PriceChange[] {
  const [changes, setChanges] = useState<PriceChange[]>([])
  const synced = useRef(false)
  useEffect(() => {
    if (!ready || synced.current) return
    const ids = useCart.getState().items.map(priceKey)
    if (ids.length === 0) return
    synced.current = true
    getCurrentPrices(ids)
      .then((current) => setChanges(useCart.getState().syncPrices(current)))
      .catch(() => {})
  }, [ready])
  return changes
}
