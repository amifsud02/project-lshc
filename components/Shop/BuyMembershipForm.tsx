'use client'

import { useState } from 'react'
import { ArrowRight, BadgeCheck } from 'lucide-react'
import { buyMembership } from '@/app/(app)/shop/[slug]/actions'
import { Button } from '@/components/ui/button'
import { ChoiceForm, UnitForm } from '@/components/Shop/UnitFields'
import type { ShopProduct } from '@/lib/shop/products'
import { formatPrice, type CustomFieldDef } from '@/lib/shop/types'
import { resolveUnit } from '@/lib/shop/units'
import { CURRENCY, toGaItem, trackEvent } from '@/lib/analytics/gtag'

type Props = {
  product: ShopProduct
  /** Extra questions for every member, e.g. which variant of a product included with the MEMBRS plan. */
  memberFields?: CustomFieldDef[]
  /** MEMBRS's platform fee in cents when the buyer pays it, charged on top of the price. */
  serviceFee?: number
}

/**
 * Memberships skip the cart: the buyer fills in each member's details here and goes straight
 * to payment, which MEMBRS takes. Every member then gets a MEMBRS account and digital card.
 */
export default function BuyMembershipForm({ product, memberFields = [], serviceFee = 0 }: Props) {
  const membersCovered = product.membership?.membersCovered ?? 1
  const templates = product.unitTemplates

  // The product each unit is for. On a choice it's whichever the member picks ('' until then).
  const [productIds, setProductIds] = useState(() =>
    templates.map((t) => (t.choices ? (t.choices.length === 1 ? t.choices[0].productId : '') : t.productId)),
  )
  const fieldsFor = (i: number, productId = productIds[i]) =>
    i < membersCovered
      ? [...templates[i].customFields, ...memberFields]
      : (resolveUnit(templates[i], productId)?.customFields ?? [])

  // Questions with a single answer (e.g. a one-size pack) are filled in already.
  const prefilled = (fields: CustomFieldDef[]) =>
    Object.fromEntries(
      fields.filter((f) => f.kind === 'select' && f.options?.length === 1).map((f) => [f.name, f.options![0].value]),
    )
  const [values, setValues] = useState<Record<string, string>[]>(() => templates.map((_, i) => prefilled(fieldsFor(i))))
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Included products follow the members in order, e.g. one T-shirt per member.
  const titleFor = (i: number) =>
    i >= membersCovered && membersCovered > 1
      ? `${templates[i].productTitle} — member ${((i - membersCovered) % membersCovered) + 1}`
      : templates[i].productTitle

  const onField = (unitIndex: number, field: string, value: string) =>
    setValues((prev) => prev.map((v, i) => (i === unitIndex ? { ...v, [field]: value } : v)))

  // Each product asks its own questions, so a new pick starts with fresh answers.
  const onPick = (unitIndex: number, productId: string) => {
    setProductIds((prev) => prev.map((p, i) => (i === unitIndex ? productId : p)))
    setValues((prev) => prev.map((v, i) => (i === unitIndex ? prefilled(fieldsFor(i, productId)) : v)))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const result = await buyMembership({
      productId: product.id,
      units: templates.map((_, i) => ({ productId: productIds[i], values: values[i] })),
    })
    if (result.ok) {
      // Payment happens on MEMBRS, so the purchase itself can't be seen from here.
      const item = toGaItem({ id: product.id, title: product.title, type: product.type, price: product.price + serviceFee })
      trackEvent('begin_checkout', { currency: CURRENCY, value: item.price, items: [item], checkout_provider: 'membrs' })
      window.location.assign(result.url)
      return
    }
    setError(result.error)
    setBusy(false)
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {templates.map((t, i) =>
        t.choices ? (
          <ChoiceForm
            key={i}
            title={titleFor(i)}
            choices={t.choices}
            productId={productIds[i]}
            values={values[i]}
            onPick={(productId) => onPick(i, productId)}
            onField={(field, value) => onField(i, field, value)}
          />
        ) : (
          <UnitForm
            key={i}
            index={0}
            total={1}
            unit={{ productTitle: titleFor(i), customFields: fieldsFor(i), values: values[i] }}
            onField={(field, value) => onField(i, field, value)}
          />
        ),
      )}

      {error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={busy} className="h-12 w-full cursor-pointer rounded-lg text-base font-medium">
        {busy ? (
          'Starting secure payment…'
        ) : (
          <>
            Buy membership · {formatPrice(product.price + serviceFee)}
            <ArrowRight />
          </>
        )}
      </Button>
      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <BadgeCheck className="mt-0.5 size-3.5 shrink-0" />
        Payment is handled by MEMBRS, the club&apos;s membership partner. Each member receives a MEMBRS account with
        their digital membership card and member discounts.
      </p>
    </form>
  )
}
