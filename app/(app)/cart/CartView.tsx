'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useSyncExternalStore } from 'react'
import { ArrowRight, Lock, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useCart } from '@/lib/shop/cart'
import { formatPrice } from '@/lib/shop/types'
import type { CartItem, CartUnit, CustomFieldDef } from '@/lib/shop/types'

const emptySubscribe = () => () => {}

export default function CartView() {
  const items = useCart((s) => s.items)
  const subtotal = useCart((s) => s.subtotal())
  const removeItem = useCart((s) => s.removeItem)
  const updateQuantity = useCart((s) => s.updateQuantity)
  const setFieldValue = useCart((s) => s.setFieldValue)
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  // Render cart-dependent UI only after hydration so server/client markup match
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )

  if (mounted && items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Empty cart
          </p>
          <h2 className="text-xl font-semibold">Nothing here yet</h2>
          <p className="text-muted-foreground">
            Browse the shop and add a membership or bundle to get started.
          </p>
          <Button render={<Link href="/shop" />} className="mt-3">
            Continue shopping
          </Button>
        </CardContent>
      </Card>
    )
  }

  const validate = (): string | null => {
    for (const item of items) {
      for (const [idx, unit] of item.units.entries()) {
        for (const f of unit.customFields) {
          if (!f.required) continue
          const v = unit.values[f.name]
          if (!v || String(v).trim() === '') {
            return `Fill in "${f.label}" for ${item.productTitle}${item.units.length > 1 ? ` (unit ${idx + 1})` : ''}.`
          }
          if (f.kind === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
            return `"${f.label}" for ${item.productTitle} is not a valid email.`
          }
        }
      }
    }
    return null
  }

  const onCheckout = () => {
    const err = validate()
    if (err) {
      setError(err)
      return
    }
    setError(null)
    router.push('/checkout')
  }

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <div className="flex flex-col gap-4 lg:col-span-7">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">Your items</h2>
          <span className="text-sm text-muted-foreground">
            {items.length} line{items.length === 1 ? '' : 's'}
          </span>
        </div>
        {items.map((item, i) => (
          <CartLine
            key={item.lineId}
            item={item}
            index={i}
            onRemove={() => removeItem(item.lineId)}
            onQty={(q) => updateQuantity(item.lineId, q)}
            onField={(unitIdx, field, value) => setFieldValue(item.lineId, unitIdx, field, value)}
          />
        ))}
      </div>

      <aside className="lg:col-span-5">
        <Card className="sticky top-8">
          <CardContent className="flex flex-col gap-4">
            <p className="text-lg font-semibold">Order summary</p>
            <ul className="flex flex-col gap-2">
              {items.map((item) => (
                <li key={item.lineId} className="flex justify-between gap-4 text-sm">
                  <span className="text-muted-foreground">
                    {item.productTitle} × {item.quantity}
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatPrice(item.unitPrice * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <Separator />
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{formatPrice(subtotal)}</span>
            </div>
            {error && (
              <p
                role="alert"
                className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </p>
            )}
            <Button
              type="button"
              size="lg"
              className="h-12 w-full cursor-pointer text-base"
              onClick={onCheckout}
            >
              Proceed to checkout
              <ArrowRight />
            </Button>
            <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Lock className="size-3" />
              Secure payment by Stripe · EUR
            </p>
          </CardContent>
        </Card>
      </aside>
    </div>
  )
}

function CartLine({
  item,
  index,
  onRemove,
  onQty,
  onField,
}: {
  item: CartItem
  index: number
  onRemove: () => void
  onQty: (q: number) => void
  onField: (unitIdx: number, field: string, value: string) => void
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Line {String(index + 1).padStart(2, '0')} ·{' '}
              {item.productType === 'bundle' ? 'Bundle' : 'Item'}
            </span>
            <h3 className="text-lg font-semibold">{item.productTitle}</h3>
            <p className="text-sm text-muted-foreground tabular-nums">
              {formatPrice(item.unitPrice)} × {item.quantity} ={' '}
              <strong className="text-foreground">
                {formatPrice(item.unitPrice * item.quantity)}
              </strong>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Label className="flex items-center gap-2 text-sm">
              Qty
              <Input
                type="number"
                min={1}
                value={item.quantity}
                onChange={(e) => onQty(Number(e.target.value))}
                className="w-20"
              />
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="cursor-pointer text-destructive hover:text-destructive"
              onClick={onRemove}
            >
              <Trash2 />
              Remove
            </Button>
          </div>
        </div>

        {item.units.map((unit, unitIdx) => (
          <UnitForm
            key={unitIdx}
            index={unitIdx}
            total={item.units.length}
            unit={unit}
            onField={(field, value) => onField(unitIdx, field, value)}
          />
        ))}
      </CardContent>
    </Card>
  )
}

function UnitForm({
  index,
  total,
  unit,
  onField,
}: {
  index: number
  total: number
  unit: CartUnit
  onField: (field: string, value: string) => void
}) {
  if (unit.customFields.length === 0) return null
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-muted/60 p-4">
      <p className="text-sm font-semibold">
        {unit.productTitle}
        {total > 1 ? ` · #${index + 1}` : ''}
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {unit.customFields.map((field) => (
          <FieldInput
            key={field.name}
            field={field}
            value={unit.values[field.name] ?? ''}
            onChange={(v) => onField(field.name, v)}
          />
        ))}
      </div>
    </div>
  )
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: CustomFieldDef
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Label className="flex flex-col items-start gap-1.5">
      <span>
        {field.label}
        {field.required && <span className="text-destructive"> *</span>}
      </span>
      {field.kind === 'select' ? (
        <select
          className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select…</option>
          {(field.options ?? []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <Input
          type={field.kind === 'email' ? 'email' : field.kind === 'phone' ? 'tel' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </Label>
  )
}
