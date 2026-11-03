// Client-safe. A product's variants: up to three options (e.g. Size, Colour) and one row per
// combination sold, each with its own SKU, price, stock and photo (Products → Variants).

export type VariantOption = { name: string; values: string[] }

export type ProductVariant = {
  id: string
  /** One value per option, in option order, e.g. ['M', 'Black']. */
  options: string[]
  /** "M / Black" */
  title: string
  sku?: string
  /** Cents; the product's price unless the variant sets its own. */
  price: number
  /** Left in stock; undefined when not tracked. */
  stock?: number
  imageUrl?: string
}

export const MAX_VARIANT_OPTIONS = 3
const OPTION_KEYS = ['option1', 'option2', 'option3'] as const

export const variantTitle = (options: string[]) => options.filter(Boolean).join(' / ')

/** The option values of a variants row in the Products collection. */
export const rowOptions = (row: any, count: number): string[] =>
  OPTION_KEYS.slice(0, count).map((k) => String(row?.[k] ?? '').trim())

export const normalizeVariantOptions = (input: any): VariantOption[] =>
  (Array.isArray(input) ? input : [])
    .map((o: any) => ({
      name: String(o?.name ?? '').trim(),
      values: (Array.isArray(o?.values) ? o.values : []).map((v: unknown) => String(v).trim()).filter(Boolean),
    }))
    .filter((o) => o.name && o.values.length)
    .slice(0, MAX_VARIANT_OPTIONS)

/** Active variants of a product doc, ready for the shop. Inactive rows are left out. */
export const normalizeVariants = (doc: any, mediaUrl: (image: any) => string | undefined): { options: VariantOption[]; variants: ProductVariant[] } => {
  const options = normalizeVariantOptions(doc?.variantOptions)
  if (!options.length || !Array.isArray(doc?.variants)) return { options: [], variants: [] }
  const basePrice = Number(doc.price) || 0
  const variants = doc.variants
    .filter((row: any) => row?.id && row.active !== false)
    .map((row: any): ProductVariant => {
      const values = rowOptions(row, options.length)
      return {
        id: String(row.id),
        options: values,
        title: variantTitle(values),
        ...(row.sku ? { sku: String(row.sku) } : {}),
        price: typeof row.price === 'number' ? Math.max(0, Math.round(row.price)) : basePrice,
        ...(typeof row.stock === 'number' ? { stock: Math.max(0, row.stock) } : {}),
        ...(mediaUrl(row.image) ? { imageUrl: mediaUrl(row.image) } : {}),
      }
    })
    .filter((v: ProductVariant) => v.options.every(Boolean))
  return { options, variants }
}

/** The variant matching a full selection, if one is sold. */
export const findVariant = (variants: ProductVariant[], selection: (string | undefined)[]) =>
  selection.every(Boolean) ? variants.find((v) => v.options.every((value, i) => value === selection[i])) : undefined

const inStock = (v: ProductVariant, ignoreStock: boolean) => ignoreStock || v.stock === undefined || v.stock > 0

/**
 * Whether picking `value` for option `index` can still lead to a variant in stock, given what's
 * picked for the other options. Drives the sold-out chips on the product page.
 */
export const canPick = (variants: ProductVariant[], selection: (string | undefined)[], index: number, value: string, ignoreStock = false) =>
  variants.some(
    (v) => v.options[index] === value && v.options.every((o, i) => i === index || !selection[i] || selection[i] === o) && inStock(v, ignoreStock),
  )

/** Cheapest and dearest variant price, for "From €X". */
export const priceRange = (variants: ProductVariant[], fallback: number) => {
  if (!variants.length) return { min: fallback, max: fallback }
  const prices = variants.map((v) => v.price)
  return { min: Math.min(...prices), max: Math.max(...prices) }
}

/** "€18.00", or "From €18.00" when variants cost different amounts. */
export const priceLabel = (variants: ProductVariant[], fallback: number, format: (cents: number) => string) => {
  const { min, max } = priceRange(variants, fallback)
  return min === max ? format(min) : `From ${format(min)}`
}

/** Every combination of the options' values, for "create missing variants". */
export const combinations = (options: VariantOption[]): string[][] =>
  options.reduce<string[][]>((acc, o) => acc.flatMap((combo) => o.values.map((v) => [...combo, v])), [[]]).filter((c) => c.length === options.length)
