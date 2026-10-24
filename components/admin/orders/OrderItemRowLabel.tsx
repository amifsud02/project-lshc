'use client'

import { useRowLabel } from '@payloadcms/ui'
import type { OrderLine } from '@/lib/shop/orderSummary'

const valuesOf = (input: unknown): Record<string, unknown> => {
  if (typeof input === 'string') {
    try {
      return JSON.parse(input)
    } catch {
      return {}
    }
  }
  return input && typeof input === 'object' ? (input as Record<string, unknown>) : {}
}

/**
 * "Couple Membership 2026/2027 — member 1 · Maria Borg" or "Club Hoodie · L" instead of
 * "Item 01" on a collapsed order line.
 */
export const OrderItemRowLabel = () => {
  const { data, rowNumber } = useRowLabel<OrderLine>()
  const { firstName, lastName, email: _email, mobile: _mobile, ...rest } = valuesOf(data?.customFieldValues)
  const member = [firstName, lastName].filter(Boolean).join(' ')
  const answers = Object.values(rest)
    .filter((v) => v != null && String(v).trim() !== '')
    .join(', ')
  const title = data?.productTitle || `Item ${String((rowNumber ?? 0) + 1).padStart(2, '0')}`
  return <span>{[title, member || answers].filter(Boolean).join(' · ')}</span>
}
