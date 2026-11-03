'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { ArrowRight, Lock, Tag, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { MAX_QUANTITY, useCart } from '@/lib/shop/cart'
import { quote, type StoreRules } from '@/lib/shop/pricing'
import { Input } from '@/components/ui/input'
import { OptionChips, QuantityStepper } from '@/components/Shop/OptionControls'
import { formatPrice, isPersonalised, isValidPhone, itemTotal, unitExtras } from '@/lib/shop/types'
import type { CartItem } from '@/lib/shop/types'
import { UnitForm } from '@/components/Shop/UnitFields'
import PriceChanges from '@/components/Shop/PriceChanges'
import { usePriceSync } from '@/lib/shop/usePriceSync'
import { CURRENCY, cartItemsToGa, gaValue, trackEvent } from '@/lib/analytics/gtag'

const emptySubscribe = () => () => {}
const NO_ITEMS: CartItem[] = []

export default function CartView({ rules }: { rules: StoreRules }) {
  // Render cart-dependent UI only after hydration so server/client markup match
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
  // The saved cart is only read in the browser, so the server render (and hydration) sees it empty.
  const savedItems = useCart((s) => s.items)
  const savedSubtotal = useCart((s) => s.subtotal())
  const items = mounted ? savedItems : NO_ITEMS
  const subtotal = mounted ? savedSubtotal : 0
  const units = items.reduce((sum, item) => sum + item.quantity, 0)
  // Shipping is listed but not chosen yet, so neither it nor its tax is in the total.
  const preview = quote({ rules, subtotal, units, country: rules.defaultCountry, formatPrice, withShipping: false })
  const removeItem = useCart((s) => s.removeItem)
  const updateQuantity = useCart((s) => s.updateQuantity)
  const setFieldValue = useCart((s) => s.setFieldValue)
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const priceChanges = usePriceSync(mounted)

  // view_cart once per visit to the page, after the saved cart has loaded.
  const viewed = useRef(false)
  useEffect(() => {
    if (!mounted || viewed.current || items.length === 0) return
    viewed.current = true
    const gaItems = cartItemsToGa(items)
    trackEvent('view_cart', { currency: CURRENCY, value: gaValue(gaItems), items: gaItems })
  }, [mounted, items])

  const onRemove = (item: CartItem) => {
    const gaItems = cartItemsToGa([item])
    trackEvent('remove_from_cart', { currency: CURRENCY, value: gaValue(gaItems), items: gaItems })
    removeItem(item.lineId)
  }

  if (mounted && items.length === 0) {
    return (
      <div className="flex flex-col gap-4">
      <PriceChanges changes={priceChanges} />
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Empty cart
          </p>
          <h2 className="text-xl font-semibold">Nothing here yet</h2>
          <p className="text-muted-foreground">
            Browse the shop to add club kit and merchandise. Memberships are bought from their own page.
          </p>
          <Button render={<Link href="/shop" />} className="mt-3">
            Continue shopping
          </Button>
        </CardContent>
      </Card>
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
          if (f.kind === 'phone' && !isValidPhone(v)) {
            return `"${f.label}" for ${item.productTitle} is not a valid phone number.`
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
        <PriceChanges changes={priceChanges} />
        {items.map((item, i) => (
          <CartLine
            key={item.lineId}
            item={item}
            index={i}
            onRemove={() => onRemove(item)}
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
                    {item.productTitle}
                    {item.variantTitle ? ` (${item.variantTitle})` : ''} × {item.quantity}
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatPrice(itemTotal(item))}
                  </span>
                </li>
              ))}
            </ul>
            <Separator />
            <dl className="flex flex-col gap-2 text-sm">
              {/* Shipping as a customer in the store's own country would see it at checkout. */}
              {preview.options.map((o, i) => (
                <div key={o.id} className="flex justify-between">
                  <dt className="text-muted-foreground">{i === 0 ? o.title : `or ${o.title.charAt(0).toLowerCase()}${o.title.slice(1)}`}</dt>
                  <dd className={i === 0 ? 'font-medium' : 'text-muted-foreground tabular-nums'}>{o.available ? (o.price ? formatPrice(o.price) : 'Free') : o.hint}</dd>
                </div>
              ))}
              {preview.tax?.inclusive && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">
                    Includes {preview.tax.name} ({preview.tax.rate}%)
                  </dt>
                  <dd className="text-muted-foreground tabular-nums">{formatPrice(preview.tax.amount)}</dd>
                </div>
              )}
              {preview.tax && !preview.tax.inclusive && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{preview.tax.name}</dt>
                  <dd className="text-muted-foreground">Added at checkout</dd>
                </div>
              )}
            </dl>
            <div className="flex justify-between text-base font-semibold">
              <span>{preview.tax && !preview.tax.inclusive ? 'Subtotal' : 'Total'}</span>
              <span className="tabular-nums">{formatPrice(subtotal)}</span>
            </div>
            {error && (
              <p
                role="alert"
                className="bg-destructive/10 px-3 py-2 text-sm text-destructive"
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
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Tag className="size-3 shrink-0" />
              Have a promo code? Add it on the payment page.
            </p>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="size-3 shrink-0" />
              Secure payment by Stripe · card, Apple Pay or Google Pay
            </p>
          </CardContent>
        </Card>
      </aside>
    </div>
  )
}

function CartLine({
  item,
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
  const href = `/shop/${item.productSlug}`
  const kind = item.productType === 'bundle' ? 'Bundle' : 'Item'
  return (
    <Card>
      <CardContent className="flex gap-4">
        <Link
          href={href}
          className="relative size-20 shrink-0 overflow-hidden bg-muted"
          aria-label={item.productTitle}
        >
          {item.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.imageUrl} alt="" className="size-full object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center bg-gradient-to-br from-primary to-foreground text-xl font-extrabold text-primary-foreground/80">
              LS
            </span>
          )}
        </Link>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-0.5">
              <Link href={href} className="text-base font-semibold hover:underline">
                {item.productTitle}
              </Link>
              {item.variantTitle && <p className="text-sm font-medium text-foreground">{item.variantTitle}</p>}
              <p className="text-sm text-muted-foreground tabular-nums">
                {formatPrice(item.unitPrice)} each · {kind}
                {item.units.some((u) => unitExtras(u) > 0)
                  ? ` · +${formatPrice(item.units.reduce((sum, u) => sum + unitExtras(u), 0))} personalisation`
                  : ''}
              </p>
              {isPersonalised(item) && (
                <p className="text-xs font-medium text-amber-700">Personalised, so it can&apos;t be returned.</p>
              )}
            </div>
            <span className="font-semibold tabular-nums">{formatPrice(itemTotal(item))}</span>
          </div>

          {item.productType === 'single'
            ? item.units.map((unit, unitIdx) =>
                unit.customFields.length === 0 ? null : (
                  <div key={unitIdx} className="flex flex-col gap-2">
                    {unit.customFields.map((field) => (
                      <div key={field.name} className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <span className="min-w-24 text-sm text-muted-foreground">
                          {field.label}
                          {item.units.length > 1 ? ` #${unitIdx + 1}` : ''}
                        </span>
                        {field.kind === 'select' ? (
                          <OptionChips
                            size="sm"
                            field={field}
                            value={unit.values[field.name] ?? ''}
                            onChange={(v) => onField(unitIdx, field.name, v)}
                          />
                        ) : (
                          <Input
                            aria-label={field.label}
                            type={field.kind === 'email' ? 'email' : field.kind === 'phone' ? 'tel' : 'text'}
                            maxLength={field.maxLength}
                            value={unit.values[field.name] ?? ''}
                            onChange={(e) => onField(unitIdx, field.name, field.personalised ? e.target.value.toUpperCase() : e.target.value)}
                            className="w-full sm:w-64"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ),
              )
            : item.units.map((unit, unitIdx) => (
                <UnitForm
                  key={unitIdx}
                  index={unitIdx}
                  total={item.units.length}
                  unit={unit}
                  onField={(field, value) => onField(unitIdx, field, value)}
                />
              ))}

          <div className="flex items-center gap-3">
            <QuantityStepper value={item.quantity} onChange={onQty} max={MAX_QUANTITY} />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="cursor-pointer text-muted-foreground hover:text-destructive"
              onClick={onRemove}
            >
              <Trash2 />
              Remove
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
