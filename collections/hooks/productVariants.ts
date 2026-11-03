import { APIError, type CollectionBeforeChangeHook } from 'payload'
import { combinations, normalizeVariantOptions, rowOptions, variantTitle } from '@/lib/shop/variants'

/**
 * Keeps a product's variants consistent on save:
 * - with "Create missing variants" ticked, adds a row for every combination not yet listed;
 * - every row must use values from the option lists, and no combination may repeat;
 * - only single products have variants, and products with variants can't be bundled
 *   (bundle and membership contents are picked without a variant).
 */
export const productVariants: CollectionBeforeChangeHook = async ({ data, req }) => {
  const options = normalizeVariantOptions(data.variantOptions)
  const rows: any[] = Array.isArray(data.variants) ? data.variants : []

  if (data.generateVariants) {
    data.generateVariants = false
    if (!options.length) throw new APIError('Add at least one option (e.g. Size) before creating variants.', 400)
    const have = new Set(rows.map((r) => variantTitle(rowOptions(r, options.length))))
    const missing = combinations(options).filter((c) => !have.has(variantTitle(c)))
    data.variants = [
      ...rows,
      ...missing.map((c) => ({ option1: c[0], option2: c[1] ?? null, option3: c[2] ?? null, active: true })),
    ]
  }

  const variants: any[] = Array.isArray(data.variants) ? data.variants : []
  if (variants.length && data.type !== 'single') throw new APIError('Only single products can have variants. Remove the variants or change the type.', 400)
  if (variants.length && !options.length) throw new APIError('Variants need at least one option (e.g. Size) with its values.', 400)

  const seen = new Set<string>()
  for (const [i, row] of variants.entries()) {
    const values = rowOptions(row, options.length)
    values.forEach((v, j) => {
      if (!v) throw new APIError(`Variant ${i + 1} has no ${options[j].name.toLowerCase()}.`, 400)
      if (!options[j].values.includes(v)) throw new APIError(`Variant ${i + 1}: “${v}” isn't one of the ${options[j].name} values (${options[j].values.join(', ')}).`, 400)
    })
    const key = variantTitle(values)
    if (seen.has(key)) throw new APIError(`${key} is listed twice in the variants.`, 400)
    seen.add(key)
  }

  if (data.type === 'bundle' || data.type === 'membership') {
    const ids = (Array.isArray(data.bundleItems) ? data.bundleItems : [])
      .flatMap((b: any) => [b.product, ...(Array.isArray(b.choices) ? b.choices : [])])
      .map((p: any) => (p && typeof p === 'object' ? p.id : p))
      .filter(Boolean)
    if (ids.length) {
      const { docs } = await req.payload.find({
        collection: 'products',
        where: { id: { in: ids }, 'variants.id': { exists: true } },
        depth: 0,
        limit: ids.length,
        select: { title: true },
        req,
      })
      if (docs.length) throw new APIError(`${docs.map((d) => d.title).join(', ')} ${docs.length === 1 ? 'has' : 'have'} variants, so can't be included here.`, 400)
    }
  }
  return data
}
