'use client'

import { useState } from 'react'
import { ArrowRight, BadgeCheck } from 'lucide-react'
import { buyMembership } from '@/app/(app)/shop/[slug]/actions'
import { Button } from '@/components/ui/button'
import { UnitForm } from '@/components/Shop/UnitFields'
import type { ShopProduct } from '@/lib/shop/products'
import { formatPrice, type CustomFieldDef } from '@/lib/shop/types'

type Props = {
  product: ShopProduct
  /** Extra questions for every member, e.g. which variant of a product included with the MEMBRS plan. */
  memberFields?: CustomFieldDef[]
}

/**
 * Memberships skip the cart: the buyer fills in each member's details here and goes straight
 * to payment, which MEMBRS takes. Every member then gets a MEMBRS account and digital card.
 */
export default function BuyMembershipForm({ product, memberFields = [] }: Props) {
  const membersCovered = product.membership?.membersCovered ?? 1
  const fieldsFor = (i: number) =>
    i < membersCovered ? [...product.unitTemplates[i].customFields, ...memberFields] : product.unitTemplates[i].customFields

  // Questions with a single answer (e.g. a one-size pack) are filled in already.
  const [values, setValues] = useState<Record<string, string>[]>(() =>
    product.unitTemplates.map((_, i) =>
      Object.fromEntries(
        fieldsFor(i)
          .filter((f) => f.kind === 'select' && f.options?.length === 1)
          .map((f) => [f.name, f.options![0].value]),
      ),
    ),
  )
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Included products follow the members in order, e.g. one T-shirt per member.
  const titleFor = (i: number) =>
    i >= membersCovered && membersCovered > 1
      ? `${product.unitTemplates[i].productTitle} — member ${((i - membersCovered) % membersCovered) + 1}`
      : product.unitTemplates[i].productTitle

  const onField = (unitIndex: number, field: string, value: string) =>
    setValues((prev) => prev.map((v, i) => (i === unitIndex ? { ...v, [field]: value } : v)))

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const result = await buyMembership({
      productId: product.id,
      units: product.unitTemplates.map((t, i) => ({ productId: t.productId, values: values[i] })),
    })
    if (result.ok) {
      window.location.assign(result.url)
      return
    }
    setError(result.error)
    setBusy(false)
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {product.unitTemplates.map((_, i) => (
        <UnitForm
          key={i}
          index={0}
          total={1}
          unit={{ productTitle: titleFor(i), customFields: fieldsFor(i), values: values[i] }}
          onField={(field, value) => onField(i, field, value)}
        />
      ))}

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
            Buy membership · {formatPrice(product.price)}
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
