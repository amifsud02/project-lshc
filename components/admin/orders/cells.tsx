'use client'

import type { DefaultCellComponentProps } from 'payload'
import { orderItemsLabel, type OrderLine } from '@/lib/shop/orderSummary'
import { formatPrice } from '@/lib/shop/types'

const STATUS: Record<string, { label: string; background: string; color: string }> = {
  pending: { label: 'Pending', background: 'var(--theme-warning-100)', color: 'var(--theme-warning-800)' },
  paid: { label: 'Paid', background: 'var(--theme-success-100)', color: 'var(--theme-success-750)' },
  fulfilled: { label: 'Fulfilled', background: 'var(--theme-elevation-100)', color: 'var(--theme-elevation-800)' },
  cancelled: { label: 'Cancelled', background: 'var(--theme-error-100)', color: 'var(--theme-error-750)' },
  refunded: { label: 'Refunded', background: 'var(--theme-error-100)', color: 'var(--theme-error-750)' },
}

/** The order status as a coloured pill. */
export const StatusCell = ({ cellData }: DefaultCellComponentProps) => {
  const status = STATUS[String(cellData)]
  if (!status) return <span>{String(cellData ?? '')}</span>
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 999,
        background: status.background,
        color: status.color,
        fontWeight: 500,
      }}
    >
      {status.label}
    </span>
  )
}

/** Cents as euros, e.g. 5000 → €50.00. */
export const MoneyCell = ({ cellData }: DefaultCellComponentProps) => (
  <span>{typeof cellData === 'number' ? formatPrice(cellData) : ''}</span>
)

/** The buyer's name with their email underneath (or just the email when no name was given). */
export const CustomerCell = ({ cellData, rowData }: DefaultCellComponentProps) => (
  <div>
    <div>{cellData ? String(cellData) : rowData.customerEmail}</div>
    {cellData ? <div style={{ color: 'var(--theme-elevation-500)' }}>{rowData.customerEmail}</div> : null}
  </div>
)

/** What was bought, e.g. "Couple Membership 2026/2027 · 2 members" or "Club T-Shirt + 2 more". */
export const ItemsCell = ({ cellData }: DefaultCellComponentProps) => (
  <span>{Array.isArray(cellData) ? orderItemsLabel(cellData as OrderLine[]) : ''}</span>
)
