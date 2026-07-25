'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useSyncExternalStore } from 'react'
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
      <div className="empty-state">
        <p className="empty-state__eyebrow">Empty cart</p>
        <h2 className="empty-state__title">Nothing here yet</h2>
        <p className="empty-state__body">
          Browse the shop and add a membership or bundle to get started.
        </p>
        <Link href="/shop" className="shop-link">
          Continue shopping
        </Link>
      </div>
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
    <div className="shop__columns">
      <div className="shop__stack">
        <div className="shop__section-head">
          <h2>Your items</h2>
          <span className="shop__section-head-meta">
            {items.length.toString().padStart(2, '0')} line{items.length === 1 ? '' : 's'}
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

      <aside className="summary">
        <p className="summary__label">Order summary</p>
        <ul className="summary__list">
          {items.map((item) => (
            <li key={item.lineId}>
              <span className="summary__list-title">
                {item.productTitle} × {item.quantity}
              </span>
              <span className="summary__list-amount">
                {formatPrice(item.unitPrice * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <div className="summary__row summary__row--total">
          <span>Total</span>
          <span className="summary__amount">{formatPrice(subtotal)}</span>
        </div>
        {error && (
          <p
            className="shop-error"
            style={{ background: 'rgba(255,255,255,0.08)', color: '#ffb4b4', marginTop: 16 }}
          >
            {error}
          </p>
        )}
        <div className="summary__cta">
          <button
            type="button"
            className="shop-btn shop-btn--light shop-btn--block"
            onClick={onCheckout}
          >
            Proceed to checkout
            <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden>
              <path d="M1 5H13M13 5L9 1M13 5L9 9" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </div>
        <p className="summary__help">
          <svg width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden>
            <path
              d="M6 1a3 3 0 0 0-3 3v2H2v7h8V6H9V4a3 3 0 0 0-3-3zm-2 5V4a2 2 0 1 1 4 0v2z"
              fill="currentColor"
            />
          </svg>
          Secure payment by Stripe · EUR
        </p>
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
    <div className="cart-line">
      <div className="cart-line__head">
        <div>
          <span className="cart-line__kicker">
            Line {String(index + 1).padStart(2, '0')} ·{' '}
            {item.productType === 'bundle' ? 'Bundle' : 'Item'}
          </span>
          <h3 className="cart-line__title">{item.productTitle}</h3>
          <p className="cart-line__price shop__mono">
            {formatPrice(item.unitPrice)} × {item.quantity} ={' '}
            <strong>{formatPrice(item.unitPrice * item.quantity)}</strong>
          </p>
        </div>
        <div className="cart-line__controls">
          <label className="cart-line__qty">
            Qty
            <input
              type="number"
              min={1}
              value={item.quantity}
              onChange={(e) => onQty(Number(e.target.value))}
            />
          </label>
          <button type="button" className="cart-line__remove" onClick={onRemove}>
            Remove
          </button>
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
    </div>
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
    <div className="cart-line__unit">
      <p className="cart-line__unit-label">
        {unit.productTitle}
        {total > 1 ? ` · #${index + 1}` : ''}
      </p>
      <div className="cart-line__fields">
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
    <label className="shop-field">
      <span className={`shop-field__label${field.required ? ' shop-field__label--required' : ''}`}>
        {field.label}
      </span>
      {field.kind === 'select' ? (
        <select
          className="shop-field__select"
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
        <input
          className="shop-field__input"
          type={field.kind === 'email' ? 'email' : field.kind === 'phone' ? 'tel' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  )
}
