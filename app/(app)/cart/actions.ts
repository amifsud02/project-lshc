'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { normalizeVariants } from '@/lib/shop/variants'

export type CurrentPrice = { price: number; available: boolean; imageUrl?: string }

/**
 * Today's price and availability for the products in a cart. The cart keeps the price from
 * when an item was added, while checkout charges the current one, so the cart re-reads it.
 */
export async function getCurrentPrices(keys: string[]): Promise<Record<string, CurrentPrice>> {
  // Keys are product IDs, or "productId:variantId" for a variant (see `priceKey`).
  const wanted = [...new Set(keys)].slice(0, 50)
  const ids = [...new Set(wanted.map((k) => k.split(':')[0]))].filter((id) => /^[a-f\d]{24}$/i.test(id))
  if (ids.length === 0) return {}
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'products',
    where: { id: { in: ids } },
    depth: 1,
    limit: ids.length,
    select: { price: true, active: true, type: true, image: true, variantOptions: true, variants: true },
  })
  const mediaUrl = (image: any) => (typeof image === 'object' && image ? (image.url ?? undefined) : undefined)
  const result: Record<string, CurrentPrice> = {}
  for (const key of wanted) {
    const [id, variantId] = key.split(':')
    const doc: any = docs.find((d) => String(d.id) === id)
    if (!doc) continue
    const productOn = Boolean(doc.active) && doc.type !== 'membership'
    const { variants } = normalizeVariants(doc, mediaUrl)
    if (variantId) {
      const v = variants.find((x) => x.id === variantId)
      result[key] = { price: v?.price ?? 0, available: productOn && Boolean(v), imageUrl: v?.imageUrl ?? mediaUrl(doc.image) }
    } else {
      // A product that has since gained variants must be picked again.
      result[key] = { price: Number(doc.price) || 0, available: productOn && variants.length === 0, imageUrl: mediaUrl(doc.image) }
    }
  }
  return result
}
