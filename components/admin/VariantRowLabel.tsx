'use client'

import { useRowLabel } from '@payloadcms/ui'
import { formatPrice } from '@/lib/shop/types'

type Row = { option1?: string; option2?: string; option3?: string; sku?: string; price?: number | null; stock?: number | null; active?: boolean }

/** "M / Black · TSHIRT-M-BLK · €22.00 · 5 in stock" instead of "Variant 01". */
export const VariantRowLabel = () => {
  const { data, rowNumber } = useRowLabel<Row>()
  const title = [data?.option1, data?.option2, data?.option3].filter(Boolean).join(' / ') || `Variant ${String((rowNumber ?? 0) + 1).padStart(2, '0')}`
  const parts = [
    title,
    data?.sku,
    typeof data?.price === 'number' ? formatPrice(data.price) : null,
    typeof data?.stock === 'number' ? (data.stock === 0 ? 'sold out' : `${data.stock} in stock`) : null,
    data?.active === false ? 'inactive' : null,
  ]
  return <span>{parts.filter(Boolean).join(' · ')}</span>
}
