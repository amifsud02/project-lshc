import type { Payload, PayloadRequest } from 'payload'
import { idOf } from './orderSummary'
import type { CustomFieldDef } from './types'

type Demand = { title: string; units: number; options: Map<string, number> }

const optionKey = (field: string, value: string) => `${field}\u0000${value}`

/** Counts what an order asks of each product: units overall, and units per select answer. */
export class StockDemand {
  private byProduct = new Map<string, Demand>()

  add(productId: string, title: string, values: Record<string, string>, fields: CustomFieldDef[]) {
    const d = this.byProduct.get(productId) ?? { title, units: 0, options: new Map() }
    d.units++
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
  shortfall(products: Map<string, { stock?: number; preorder?: unknown; customFields: CustomFieldDef[] }>): string | null {
    for (const [id, d] of this.byProduct) {
      const product = products.get(id)
      if (!product || product.preorder) continue
      if (product.stock !== undefined && d.units > product.stock) {
        return product.stock === 0 ? `${d.title} is sold out.` : `Only ${product.stock} ${d.title} left.`
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

/**
 * Takes a paid order's items out of stock: the product's own count and the count of each size
 * (or other select answer) bought. Untracked stock (empty) is left alone. Membership member lines
 * aren't stock.
 */
export async function decrementStockForOrder(payload: Payload, order: any, req?: PayloadRequest): Promise<void> {
  const lines = (order?.items ?? []).filter((line: any) => !line.membershipSeason && idOf(line.product))
  const byProduct = new Map<string, any[]>()
  for (const line of lines) {
    const id = idOf(line.product)!
    byProduct.set(id, [...(byProduct.get(id) ?? []), line])
  }

  for (const [id, productLines] of byProduct) {
    const doc: any = await payload.findByID({ collection: 'products', id, depth: 0, req }).catch(() => null)
    if (!doc) continue
    const count = productLines.reduce((sum, l) => sum + (Number(l.quantity) || 1), 0)
    let changed = false
    const data: any = {}
    if (typeof doc.stock === 'number') {
      data.stock = Math.max(0, doc.stock - count)
      changed = true
    }
    if (Array.isArray(doc.customFields)) {
      data.customFields = doc.customFields.map((f: any) => {
        if (f.kind !== 'select' || !Array.isArray(f.options)) return f
        return {
          ...f,
          options: f.options.map((o: any) => {
            if (typeof o.stock !== 'number') return o
            const sold = productLines
              .filter((l) => (l.customFieldValues ?? {})[f.name] === o.value)
              .reduce((sum, l) => sum + (Number(l.quantity) || 1), 0)
            if (!sold) return o
            changed = true
            return { ...o, stock: Math.max(0, o.stock - sold) }
          }),
        }
      })
    }
    if (changed) {
      await payload.update({ collection: 'products', id, data, depth: 0, req, overrideAccess: true })
    }
  }
}
