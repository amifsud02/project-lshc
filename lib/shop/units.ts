import { hasBundleItems, MEMBER_FIELDS, type CustomFieldDef, type ProductType } from './types'

export type UnitOption = {
  productId: string
  productTitle: string
  customFields: CustomFieldDef[]
}

export type UnitTemplate = UnitOption & {
  /**
   * Memberships only: the buyer picks one of these products (e.g. a T-shirt or a hoodie) and
   * answers its questions. `productId` is empty and `productTitle` is the heading to show.
   */
  choices?: UnitOption[]
}

/** On a membership, an included products row can be a choice of products; bundles only have fixed products. */
export const isChoice = (type: unknown, item: any) => type === 'membership' && item?.kind === 'choice'

/** "A", "A or B", "A, B or C". */
export const orList = (items: string[]) =>
  items.length > 1 ? `${items.slice(0, -1).join(', ')} or ${items[items.length - 1]}` : (items[0] ?? '')

/**
 * The product a unit was filled in for: the template itself, or the option picked from its
 * choices. Undefined when `productId` isn't one the template allows (or nothing was picked).
 */
export const resolveUnit = (template: UnitTemplate, productId: string): UnitOption | undefined =>
  template.choices
    ? template.choices.find((c) => c.productId === productId)
    : template.productId === productId
      ? template
      : undefined

export const normalizeCustomFields = (input: any): CustomFieldDef[] => {
  if (!Array.isArray(input)) return []
  return input
    .filter((f) => f?.name && f?.label && f?.kind)
    .map((f) => ({
      name: String(f.name),
      label: String(f.label),
      kind: f.kind,
      required: Boolean(f.required),
      options: Array.isArray(f.options)
        ? f.options
            .filter((o: any) => o?.value && o?.label)
            .map((o: any) => ({ value: String(o.value), label: String(o.label) }))
        : undefined,
    }))
}

const toOption = (product: any): UnitOption => ({
  productId: String(product.id),
  productTitle: String(product.title ?? ''),
  customFields: normalizeCustomFields(product.customFields),
})

/**
 * The units a buyer fills in for one purchase of `doc`. Included products must be populated
 * (depth 1 or more); unpopulated ones are skipped.
 */
export function buildUnitTemplates(doc: any): UnitTemplate[] {
  const type = (doc?.type as ProductType) ?? 'single'
  const unitTemplates: UnitTemplate[] = []
  const ownFields = normalizeCustomFields(doc.customFields)
  const membersCovered = Math.max(1, Number(doc.membership?.membersCovered) || 1)

  if (type === 'membership') {
    // One unit per person covered, each asking for that member's details.
    for (let i = 0; i < membersCovered; i++) {
      unitTemplates.push({
        productId: String(doc.id),
        productTitle: membersCovered > 1 ? `${doc.title ?? ''} — member ${i + 1}` : String(doc.title ?? ''),
        customFields: [...MEMBER_FIELDS, ...ownFields],
      })
    }
  }

  if (hasBundleItems(type) && Array.isArray(doc.bundleItems)) {
    if (type === 'bundle' && ownFields.length > 0) {
      unitTemplates.push({
        productId: String(doc.id),
        productTitle: String(doc.title ?? ''),
        customFields: ownFields,
      })
    }
    for (const item of doc.bundleItems) {
      const qty = Math.max(1, Number(item?.quantity) || 1)
      let template: UnitTemplate
      if (isChoice(type, item)) {
        const choices = (Array.isArray(item.choices) ? item.choices : [])
          .filter((c: any) => c && typeof c === 'object')
          .map(toOption)
        if (choices.length === 0) continue
        template = {
          productId: '',
          productTitle: String(item.label || orList(choices.map((c: UnitOption) => c.productTitle))),
          customFields: [],
          choices,
        }
      } else {
        const child = typeof item?.product === 'object' ? item.product : null
        if (!child) continue
        template = toOption(child)
      }
      for (let i = 0; i < qty; i++) unitTemplates.push(template)
    }
  } else if (type !== 'membership') {
    unitTemplates.push({
      productId: String(doc.id),
      productTitle: String(doc.title ?? ''),
      customFields: ownFields,
    })
  }

  return unitTemplates
}
