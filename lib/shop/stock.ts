import type { Payload, PayloadRequest } from 'payload'
import { refreshSite } from '@/collections/hooks/revalidateContent'
import { idOf } from './orderSummary'
import type { CustomFieldDef } from './types'
import type { ProductVariant } from './variants'

type Demand = { title: string; units: number; options: Map<string, number>; variants: Map<string, number> }

const optionKey = (field: string, value: string) => `${field}\u0000${value}`

type StockInfo = { stock?: number; preorder?: unknown; customFields: CustomFieldDef[]; variants?: ProductVariant[] }

/** Counts what an order asks of each product: units overall, per variant, and per select answer. */
export class StockDemand {
  private byProduct = new Map<string, Demand>()

  add(productId: string, title: string, values: Record<string, string>, fields: CustomFieldDef[], variantId?: string) {
    const d = this.byProduct.get(productId) ?? { title, units: 0, options: new Map(), variants: new Map() }
    d.units++
    if (variantId) d.variants.set(variantId, (d.variants.get(variantId) ?? 0) + 1)
    for (const f of fields) {
      const v = values?.[f.name]
      if (f.kind === 'select' && v) d.options.set(optionKey(f.name, v), (d.options.get(optionKey(f.name, v)) ?? 0) + 1)
    }
    this.byProduct.set(productId, d)
  }

  /**
   * The first thing there isn't enough of, as a message for the buyer, or null. Products taking
   * pre-orders are never short.
   */
  shortfall(products: Map<string, StockInfo>): string | null {
    for (const [id, d] of this.byProduct) {
      const product = products.get(id)
      if (!product || product.preorder) continue
      if (product.stock !== undefined && d.units > product.stock) {
        return product.stock === 0 ? `${d.title} is sold out.` : `Only ${product.stock} ${d.title} left.`
      }
      for (const [variantId, wanted] of d.variants) {
        const v = product.variants?.find((x) => x.id === variantId)
        if (v?.stock !== undefined && wanted > v.stock) {
          return v.stock === 0 ? `${d.title} in ${v.title} is sold out.` : `Only ${v.stock} ${d.title} left in ${v.title}.`
        }
      }
      for (const f of product.customFields) {
        for (const o of f.options ?? []) {
          const wanted = d.options.get(optionKey(f.name, o.value)) ?? 0
          if (o.stock !== undefined && wanted > o.stock) {
            return o.stock === 0
              ? `${d.title} in ${f.label.toLowerCase()} ${o.label} is sold out.`
              : `Only ${o.stock} ${d.title} left in ${f.label.toLowerCase()} ${o.label}.`
          }
        }
      }
    }
    return null
  }
}

type Model = {
  updateOne: (filter: object, update: object, options?: object) => Promise<{ modifiedCount: number }>
}

/** Where a stock count lives in a product document. */
type Count = {
  /** Mongo update path, e.g. "stock" or "variants.$[v].stock". */
  path: string
  /** Picks the array elements for a path with $[…]; the last one is the element holding `stock`. */
  arrayFilters?: Record<string, unknown>[]
  /** The same count read from a fetched document. */
  read: (doc: any) => unknown
}

/** `filter` plus a condition on the count itself: in the query, or on the innermost array element. */
const withCondition = (count: Count, cond: object) => {
  // No automatic updatedAt: it would count as a change even when no stock matched the condition.
  if (!count.arrayFilters) return { query: { [count.path]: cond }, options: { timestamps: false } }
  const filters = [...count.arrayFilters]
  const last = filters.pop()!
  const alias = Object.keys(last)[0].split('.')[0]
  return { query: {}, options: { timestamps: false, arrayFilters: [...filters, { ...last, [`${alias}.stock`]: cond }] } }
}

/**
 * Takes `n` off one stock count with a single conditional database update, so two orders paid
 * at the same moment can't both read the same count and lose a sale, as a read-then-write can.
 * Returns the count left before, when there wasn't enough (it is then set to 0); undefined when
 * the update went through or the count isn't tracked.
 */
async function take(model: Model, payload: Payload, id: string, count: Count, n: number): Promise<number | undefined> {
  const enough = withCondition(count, { $gte: n })
  const res = await model.updateOne({ _id: id, ...enough.query }, { $inc: { [count.path]: -n } }, enough.options)
  if (res.modifiedCount) return undefined
  // Not enough, or not tracked: look at what's there now.
  const doc = await payload.findByID({ collection: 'products', id, depth: 0, overrideAccess: true }).catch(() => null)
  const left = count.read(doc)
  if (typeof left !== 'number') return undefined
  const short = withCondition(count, { $type: 'number', $lt: n })
  await model.updateOne({ _id: id, ...short.query }, { $set: { [count.path]: 0 } }, short.options)
  return left
}

/**
 * Takes a paid order's items out of stock: the product's own count, each variant's, and each
 * size (or other select answer) bought, each with an atomic update (see `take`). Returns what was
 * oversold, e.g. "Classic T-shirt M / Black: 2 ordered, 1 left", so the order can be flagged.
 * Membership member lines aren't stock.
 */
export async function decrementStockForOrder(payload: Payload, order: any, _req?: PayloadRequest): Promise<string[]> {
  const model = (payload.db as unknown as { collections?: Record<string, Model> }).collections?.products
  if (!model) throw new Error('Stock updates need the MongoDB adapter')
  const lines = (order?.items ?? []).filter((line: any) => !line.membershipSeason && idOf(line.product))
  const byProduct = new Map<string, any[]>()
  for (const line of lines) {
    const id = idOf(line.product)!
    byProduct.set(id, [...(byProduct.get(id) ?? []), line])
  }

  const oversold: string[] = []
  const qty = (l: any) => Number(l.quantity) || 1
  for (const [id, productLines] of byProduct) {
    const doc: any = await payload.findByID({ collection: 'products', id, depth: 0, overrideAccess: true }).catch(() => null)
    if (!doc) continue
    const title = doc.title ?? productLines[0]?.productTitle ?? 'Item'
    const flag = (what: string, wanted: number, left: number | undefined) => {
      if (left !== undefined) oversold.push(`${what}: ${wanted} ordered, ${left} left`)
    }

    const hasVariants = Array.isArray(doc.variants) && doc.variants.length > 0
    // With variants, stock is counted per variant only.
    if (!hasVariants && typeof doc.stock === 'number') {
      const n = productLines.reduce((sum, l) => sum + qty(l), 0)
      flag(title, n, await take(model, payload, id, { path: 'stock', read: (d) => d?.stock }, n))
    }

    if (hasVariants) {
      const perVariant = new Map<string, { n: number; title: string }>()
      for (const l of productLines) {
        if (!l.variantId) continue
        const v = perVariant.get(l.variantId) ?? { n: 0, title: l.variantTitle ?? '' }
        perVariant.set(l.variantId, { ...v, n: v.n + qty(l) })
      }
      for (const [variantId, { n, title: variant }] of perVariant) {
        const count: Count = {
          path: 'variants.$[v].stock',
          arrayFilters: [{ 'v.id': variantId }],
          read: (d) => d?.variants?.find((v: any) => v.id === variantId)?.stock,
        }
        flag(`${title} ${variant}`.trim(), n, await take(model, payload, id, count, n))
      }
    }

    for (const f of Array.isArray(doc.customFields) ? doc.customFields : []) {
      if (f.kind !== 'select' || !Array.isArray(f.options)) continue
      for (const o of f.options) {
        if (typeof o.stock !== 'number') continue
        const n = productLines.filter((l) => (l.customFieldValues ?? {})[f.name] === o.value).reduce((sum, l) => sum + qty(l), 0)
        if (!n) continue
        const count: Count = {
          path: 'customFields.$[f].options.$[o].stock',
          arrayFilters: [{ 'f.name': f.name }, { 'o.value': o.value }],
          read: (d) => d?.customFields?.find((x: any) => x.name === f.name)?.options?.find((x: any) => x.value === o.value)?.stock,
        }
        flag(`${title} ${o.label}`, n, await take(model, payload, id, count, n))
      }
    }
  }
  // These updates skip Payload's hooks, so clear the cached shop pages here.
  if (byProduct.size) refreshSite('products')
  return oversold
}
