'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowRight, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MAX_QUANTITY, useCart } from '@/lib/shop/cart'
import type { ShopProduct } from '@/lib/shop/products'
import { CURRENCY, toGaItem, trackEvent } from '@/lib/analytics/gtag'
import { OptionChips, QuantityStepper } from './OptionControls'
import { Input } from '@/components/ui/input'
import { formatPrice, type CustomFieldDef } from '@/lib/shop/types'
import { canPick, findVariant, priceRange } from '@/lib/shop/variants'

type Props = { product: ShopProduct }

/**
 * Picks a single item's options (sizes as chips) and quantity, then adds it to the cart.
 * Bundles are added as they are; their contents' questions are answered in the cart.
 */
export default function AddToCartButton({ product }: Props) {
  const addItem = useCart((s) => s.addItem)
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [values, setValues] = useState<Record<string, string>>({})
  const [picked, setPicked] = useState<(string | undefined)[]>([])
  const [error, setError] = useState<string | null>(null)

  // Sizes and anything printed on the item are asked up front; other questions stay in the cart.
  const options = product.type === 'single' ? product.customFields.filter((f) => f.kind === 'select') : []
  const printed = product.type === 'single' ? product.customFields.filter((f) => f.kind === 'text' && f.personalised) : []
  const preorder = Boolean(product.preorder)
  // Variants (e.g. size and colour) as chips; a value is struck through when no variant in
  // stock goes with what's already picked.
  const { variants, variantOptions } = product
  const variant = findVariant(variants, picked)
  const variantFields: CustomFieldDef[] = variantOptions.map((o, i) => ({
    name: `variant-${i}`,
    label: o.name,
    kind: 'select',
    required: true,
    options: o.values.map((v) => ({ value: v, label: v, ...(canPick(variants, picked, i, v, preorder) ? {} : { stock: 0 }) })),
  }))
  const price = variant?.price ?? (variants.length ? priceRange(variants, product.price).min : product.price)
  const soldOut =
    !preorder &&
    (product.stock === 0 ||
      options.some((f) => f.required && (f.options ?? []).every((o) => o.stock === 0)) ||
      (variants.length > 0 ? variants.every((v) => v.stock === 0) : variantOptions.length > 0))
  const extra = printed.reduce((sum, f) => sum + (f.surcharge && values[f.name]?.trim() ? f.surcharge : 0), 0)
  const fewLeft = (() => {
    if (preorder) return null
    if (variant?.stock !== undefined && variant.stock > 0 && variant.stock <= 3) return `Only ${variant.stock} left in ${variant.title}`
    for (const f of options) {
      const chosen = f.options?.find((o) => o.value === values[f.name])
      if (chosen?.stock !== undefined && chosen.stock > 0 && chosen.stock <= 3) return `Only ${chosen.stock} left in ${chosen.label}`
    }
    return product.stock !== undefined && product.stock > 0 && product.stock <= 3 ? `Only ${product.stock} left` : null
  })()
  const dispatch = product.preorder?.dispatchDate
    ? new Intl.DateTimeFormat('en-MT', { day: 'numeric', month: 'long' }).format(new Date(product.preorder.dispatchDate))
    : null

  const onClick = () => {
    const missingVariant = variantOptions.find((_, i) => !picked[i])
    if (missingVariant) {
      setError(`Choose a ${missingVariant.name.toLowerCase()}.`)
      return
    }
    if (variants.length && !variant) {
      setError("That combination isn't available. Try another.")
      return
    }
    const missing = options.find((f) => f.required && !values[f.name])
    const answers = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v.trim()]).filter(([, v]) => v))
    if (missing) {
      setError(`Choose a ${missing.label.toLowerCase()}.`)
      return
    }
    setBusy(true)
    addItem({
      productId: product.id,
      productSlug: product.slug,
      productTitle: product.title,
      productType: product.type,
      imageUrl: variant?.imageUrl ?? product.imageUrl,
      unitPrice: price,
      quantity,
      ...(variant ? { variantId: variant.id, variantTitle: variant.title } : {}),
      values: answers,
      unitTemplates: product.unitTemplates,
    })
    const item = toGaItem({ id: product.id, title: variant ? `${product.title} (${variant.title})` : product.title, type: product.type, price, quantity })
    trackEvent('add_to_cart', { currency: CURRENCY, value: item.price * quantity, items: [item] })
    router.push('/cart')
  }

  return (
    <div className="flex flex-col gap-5">
      {variantFields.map((field, i) => (
        <div key={field.name} className="flex flex-col gap-2">
          <span className="text-sm font-semibold">
            {field.label}
            {picked[i] ? <span className="font-normal text-muted-foreground"> · {picked[i]}</span> : null}
          </span>
          <OptionChips
            field={field}
            value={picked[i] ?? ''}
            onChange={(v) => {
              setPicked((prev) => {
                const next = [...prev]
                next[i] = v
                return next
              })
              setError(null)
            }}
          />
        </div>
      ))}
      {variant?.sku && <span className="-mt-3 text-xs text-muted-foreground">SKU {variant.sku}</span>}
      {options.map((field) => (
        <div key={field.name} className="flex flex-col gap-2">
          <span className="text-sm font-semibold">
            {field.label}
            {values[field.name] ? (
              <span className="font-normal text-muted-foreground"> · {field.options?.find((o) => o.value === values[field.name])?.label}</span>
            ) : null}
          </span>
          <OptionChips
            field={field}
            ignoreStock={preorder}
            value={values[field.name] ?? ''}
            onChange={(v) => {
              setValues((prev) => ({ ...prev, [field.name]: v }))
              setError(null)
            }}
          />
        </div>
      ))}
      {printed.map((field) => (
        <label key={field.name} className="flex flex-col gap-2">
          <span className="text-sm font-semibold">
            {field.label}
            <span className="font-normal text-muted-foreground">
              {' '}
              (optional{field.surcharge ? ` · +${formatPrice(field.surcharge)}` : ''})
            </span>
          </span>
          <Input
            value={values[field.name] ?? ''}
            maxLength={field.maxLength}
            onChange={(e) => setValues((prev) => ({ ...prev, [field.name]: e.target.value.toUpperCase() }))}
            placeholder="e.g. BORG 7"
          />
          <span className="flex justify-between text-xs text-muted-foreground">
            <span>Printed on the item, so it can&apos;t be returned.</span>
            {field.maxLength ? (
              <span className="tabular-nums">
                {(values[field.name] ?? '').length}/{field.maxLength}
              </span>
            ) : null}
          </span>
        </label>
      ))}
      {preorder && (
        <p className="rounded-lg bg-primary/5 px-3 py-2 text-sm text-primary">
          <strong>Pre-order.</strong> {dispatch ? `Expected by ${dispatch}.` : 'We email you when it arrives.'}
        </p>
      )}
      {fewLeft && <p className="text-sm font-medium text-amber-700">{fewLeft}</p>}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold">Quantity</span>
        <QuantityStepper value={quantity} onChange={setQuantity} max={MAX_QUANTITY} />
        {quantity > 1 && options.length > 0 ? (
          <span className="text-xs text-muted-foreground">You can pick a different size for each one in your cart.</span>
        ) : null}
      </div>
      {error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <Button
        type="button"
        size="lg"
        onClick={onClick}
        disabled={busy || soldOut}
        className="h-12 w-full cursor-pointer rounded-none text-base font-medium"
      >
        {soldOut ? (
          'Sold out'
        ) : busy ? (
          'Adding…'
        ) : (
          <>
            <ShoppingCart />
            {preorder ? 'Pre-order' : 'Add to cart'}
            {variant || extra > 0 ? ` · ${formatPrice((price + extra) * quantity)}` : ''}
            <ArrowRight />
          </>
        )}
      </Button>
    </div>
  )
}
