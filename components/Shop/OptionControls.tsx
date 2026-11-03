'use client'

import { Minus, Plus } from 'lucide-react'
import type { CustomFieldDef } from '@/lib/shop/types'
import { cn } from '@/lib/utils'

/** A select question (e.g. a size) as a row of chips. */
export function OptionChips({
  field,
  value,
  onChange,
  size = 'md',
  ignoreStock = false,
}: {
  field: CustomFieldDef
  value: string
  onChange: (value: string) => void
  size?: 'sm' | 'md'
  /** Pre-orders can pick sizes that are out of stock. */
  ignoreStock?: boolean
}) {
  return (
    <div role="radiogroup" aria-label={field.label} className="flex flex-wrap gap-2">
      {(field.options ?? []).map((o) => {
        const on = o.value === value
        const soldOut = !ignoreStock && o.stock === 0
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            aria-disabled={soldOut}
            disabled={soldOut}
            title={soldOut ? `${o.label} is sold out` : undefined}
            onClick={() => onChange(o.value)}
            className={cn(
              'cursor-pointer border font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
              size === 'sm' ? 'min-w-9 px-2.5 py-1 text-xs' : 'min-w-11 px-3.5 py-2 text-sm',
              soldOut
                ? 'cursor-not-allowed border-dashed border-input bg-muted/50 text-muted-foreground line-through'
                : on
                  ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary'
                  : 'border-input bg-background text-foreground hover:border-primary/50',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/** − / + buttons around a count, with 40px targets. */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 10,
  label = 'Quantity',
}: {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  label?: string
}) {
  const btn =
    'flex size-10 cursor-pointer items-center justify-center text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40'
  return (
    <div role="group" aria-label={label} className="inline-flex w-fit items-center overflow-hidden border border-input bg-background">
      <button type="button" className={btn} aria-label="Decrease quantity" disabled={value <= min} onClick={() => onChange(value - 1)}>
        <Minus className="size-4" />
      </button>
      <span aria-live="polite" className="w-10 border-x border-input text-center text-sm font-semibold tabular-nums leading-10">
        {value}
      </span>
      <button type="button" className={btn} aria-label="Increase quantity" disabled={value >= max} onClick={() => onChange(value + 1)}>
        <Plus className="size-4" />
      </button>
    </div>
  )
}
