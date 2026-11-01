import type { Payload } from 'payload'
import { idOf, summarizeOrder, type OrderLine, type OrderSummary, type ProductQuestions } from './orderSummary'
import { normalizeCustomFields } from './units'

/** What each of the order's products asks, so answers can be shown as "T-shirt size: L". */
export async function loadOrderQuestions(payload: Payload, items: OrderLine[]): Promise<ProductQuestions> {
  const ids = [...new Set(items.map((line) => idOf(line.product)).filter((id): id is string => Boolean(id)))]
  if (ids.length === 0) return {}
  const { docs } = await payload.find({
    collection: 'products',
    where: { id: { in: ids } },
    depth: 0,
    limit: ids.length,
    select: { title: true, customFields: true },
    overrideAccess: true,
  })
  return Object.fromEntries(
    docs.map((doc) => [String(doc.id), { title: doc.title, customFields: normalizeCustomFields(doc.customFields) }]),
  )
}

/** `summarizeOrder` with the answers labelled from the products' questions. */
export async function summarizeOrderFor(payload: Payload, items: OrderLine[]): Promise<OrderSummary> {
  return summarizeOrder(items, await loadOrderQuestions(payload, items))
}
