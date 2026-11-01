'use server'

import { getPayload } from 'payload'
import config from '@payload-config'

export type CurrentPrice = { price: number; available: boolean; imageUrl?: string }

/**
 * Today's price and availability for the products in a cart. The cart keeps the price from
 * when an item was added, while checkout charges the current one, so the cart re-reads it.
 */
export async function getCurrentPrices(productIds: string[]): Promise<Record<string, CurrentPrice>> {
  const ids = [...new Set(productIds)].filter((id) => /^[a-f\d]{24}$/i.test(id)).slice(0, 50)
  if (ids.length === 0) return {}
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'products',
    where: { id: { in: ids } },
    depth: 1,
    limit: ids.length,
    select: { price: true, active: true, type: true, image: true },
  })
  return Object.fromEntries(
    docs.map((doc) => [
      String(doc.id),
      {
        price: Number(doc.price) || 0,
        available: Boolean(doc.active) && doc.type !== 'membership',
        imageUrl: typeof doc.image === 'object' && doc.image ? (doc.image.url ?? undefined) : undefined,
      },
    ]),
  )
}
