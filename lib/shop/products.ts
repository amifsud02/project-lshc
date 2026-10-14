import { getPayload } from 'payload'
import config from '@payload-config'
import type { CustomFieldDef, ProductType } from './types'
import { buildUnitTemplates, normalizeCustomFields, type UnitTemplate } from './units'
import { cachedFind } from '@/lib/utils/payload/cached'
import { getGeneralGlobal } from '@/lib/utils/payload/globals'

export type ShopProduct = {
  id: string
  slug: string
  title: string
  type: ProductType
  price: number
  /** Memberships only: the season sold and how many people one purchase covers. */
  membership?: { season: string; membersCovered: number; membrsPlanId?: number }
  active: boolean
  imageUrl?: string
  description?: unknown
  customFields: CustomFieldDef[]
  unitTemplates: UnitTemplate[]
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
    depth: 1,
    limit: 200,
    sort: 'title',
  })
  return Promise.all(docs.map((d: any) => mapProduct(d)))
}

export async function getProductBySlug(slug: string): Promise<ShopProduct | null> {
  const { docs } = await cachedFind({
    collection: 'products',
    where: { slug: { equals: slug } },
    depth: 1,
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
  const ownFields = normalizeCustomFields(doc.customFields)
  const membersCovered = Math.max(1, Number(doc.membership?.membersCovered) || 1)
  const unitTemplates = buildUnitTemplates(doc)

  return {
    id: String(doc.id),
    slug: String(doc.slug),
    title: String(doc.title ?? ''),
    type,
    price: Number(doc.price) || 0,
    active: Boolean(doc.active),
    // Falls back to the Fallback Image in Site Settings.
    imageUrl: mediaUrl(doc.image) ?? (await getGeneralGlobal()).fallbackImageUrl,
    description: doc.description,
    customFields: ownFields,
    unitTemplates,
    membership:
      type === 'membership'
        ? {
            season: String(doc.membership?.season ?? ''),
            membersCovered,
            membrsPlanId: Number(doc.membership?.membrsPlanId) || undefined,
          }
        : undefined,
  }
}
