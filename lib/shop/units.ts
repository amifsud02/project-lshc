import { hasBundleItems, MEMBER_FIELDS, type CustomFieldDef, type ProductType } from './types'

export type UnitTemplate = {
  productId: string
  productTitle: string
  customFields: CustomFieldDef[]
}

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
      const child = typeof item?.product === 'object' ? item.product : null
      if (!child) continue
      const qty = Math.max(1, Number(item?.quantity) || 1)
      const childFields = normalizeCustomFields(child.customFields)
      for (let i = 0; i < qty; i++) {
        unitTemplates.push({
          productId: String(child.id),
          productTitle: String(child.title ?? ''),
          customFields: childFields,
        })
      }
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

