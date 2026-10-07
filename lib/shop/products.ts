import { getPayload } from 'payload'
import config from '@payload-config'
import { hasBundleItems, MEMBER_FIELDS, type CustomFieldDef, type ProductType } from './types'
import { cachedFind } from '@/lib/utils/payload/cached'

export type ShopProduct = {
  id: string
  slug: string
  title: string
  type: ProductType
  price: number
  /** Memberships only: the season sold and how many people one purchase covers. */
  membership?: { season: string; membersCovered: number }
  active: boolean
  imageUrl?: string
  description?: unknown
  customFields: CustomFieldDef[]
  unitTemplates: Array<{
    productId: string
    productTitle: string
    customFields: CustomFieldDef[]
  }>
}

const normalizeCustomFields = (input: any): CustomFieldDef[] => {
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

const mediaUrl = (image: any): string | undefined => {
  if (!image) return undefined
  if (typeof image === 'string') return undefined
  return image.url ?? undefined
}

export async function getActiveProducts(): Promise<ShopProduct[]> {
  const { docs } = await cachedFind({
    collection: 'products',
    where: { active: { equals: true } },
    depth: 2,
    limit: 200,
    sort: 'title',
  })
  return Promise.all(docs.map((d: any) => mapProduct(d)))
}

export async function getProductBySlug(slug: string): Promise<ShopProduct | null> {
  const { docs } = await cachedFind({
    collection: 'products',
    where: { slug: { equals: slug } },
    depth: 2,
    limit: 1,
  })
  if (!docs[0]) return null
  return mapProduct(docs[0])
}

export async function getProductById(id: string): Promise<ShopProduct | null> {
  const payload = await getPayload({ config })
  try {
    const doc = await payload.findByID({ collection: 'products', id, depth: 2 })
    return mapProduct(doc)
  } catch {
    return null
  }
}

async function mapProduct(doc: any): Promise<ShopProduct> {
  const type = (doc?.type as ProductType) ?? 'single'
  const unitTemplates: ShopProduct['unitTemplates'] = []
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

  return {
    id: String(doc.id),
    slug: String(doc.slug),
    title: String(doc.title ?? ''),
    type,
    price: Number(doc.price) || 0,
    active: Boolean(doc.active),
    imageUrl: mediaUrl(doc.image),
    description: doc.description,
    customFields: ownFields,
    unitTemplates,
    membership:
      type === 'membership'
        ? { season: String(doc.membership?.season ?? ''), membersCovered }
        : undefined,
  }
}
