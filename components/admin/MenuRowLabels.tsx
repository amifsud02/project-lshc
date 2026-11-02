'use client'

import { useRowLabel } from '@payloadcms/ui'

type LinkRow = { link?: { label?: string } }

const fallback = (word: string, rowNumber?: number) => `${word} ${String((rowNumber ?? 0) + 1).padStart(2, '0')}`

/** "Teams · menu panel" instead of "Menu Link 02" on a collapsed header row. */
export const MenuLinkRowLabel = () => {
  const { data, rowNumber } = useRowLabel<LinkRow & { enableMegaMenu?: boolean }>()
  const label = data?.link?.label || fallback('Menu Link', rowNumber)
  return <span>{data?.enableMegaMenu ? `${label} · menu panel` : label}</span>
}

/** A column's heading, or its first link, instead of "Column 01". */
export const MenuColumnRowLabel = () => {
  const { data, rowNumber } = useRowLabel<{ heading?: string; links?: LinkRow[] }>()
  return <span>{data?.heading || data?.links?.[0]?.link?.label || fallback('Column', rowNumber)}</span>
}

/** A link's own label instead of "Link 01". */
export const LinkRowLabel = () => {
  const { data, rowNumber } = useRowLabel<LinkRow>()
  return <span>{data?.link?.label || fallback('Link', rowNumber)}</span>
}
