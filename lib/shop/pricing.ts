// Client-safe. Works out shipping, coupon discount and tax for a cart, so the checkout page and
// `createCheckoutSession` always agree. The rules come from `getStoreRules()` (lib/shop/storeRules.ts):
// Store setup's shipping zones, tax rates and coupons once configured, otherwise Site Settings → Shop.
import type { FulfilmentMethod } from './settings'

export type ShippingMethodRule =
  | { id: string; kind: 'local_pickup'; title: string; cost: number; details?: string }
  | { id: string; kind: 'flat_rate'; title: string; cost: number; perItem: number; taxable: boolean; details?: string }
  | { id: string; kind: 'free_shipping'; title: string; requires: 'none' | 'coupon' | 'min_amount' | 'either' | 'both'; minAmount: number; ignoreDiscounts: boolean }

export type ZoneRule = { name: string; countries: string[]; methods: ShippingMethodRule[] }

export type TaxRateRule = { country?: string; rate: number; name: string; priority: number; shipping: boolean }

export type StoreRules = {
  /** Where each rule set came from, for the admin and for debugging. */
  source: { shipping: 'store-setup' | 'site-settings'; tax: 'store-setup' | 'site-settings' }
  defaultCountry: string
  /** Countries offered at checkout. One country hides the picker. */
  countries: { value: string; label: string }[]
  zones: ZoneRule[]
  tax: { inclusive: boolean; rates: TaxRateRule[] } | null
  /** Show the coupon field (Store setup coupons switched on and at least one exists). */
  coupons: boolean
}

export type CouponTerms = {
  code: string
  discountType: 'percent' | 'fixed_cart' | 'fixed_product'
  amount: number
  freeShipping: boolean
  minimumSpend?: number | null
  maximumSpend?: number | null
}

export type ShippingOption = {
  id: string
  title: string
  details?: string
  /** Pickup is collection; everything else needs an address. */
  method: FulfilmentMethod
  price: number
  taxable: boolean
  available: boolean
  /** Why an option isn't available yet, e.g. "Spend €12.00 more". */
  hint?: string
}

export type Quote = {
  zone?: string
  options: ShippingOption[]
  selected?: ShippingOption
  discount: number
  shipping: number
  tax: { name: string; rate: number; amount: number; inclusive: boolean } | null
  total: number
}

/** The first zone listing the country, else the catch-all zone (no countries). */
export const matchZone = (zones: ZoneRule[], country: string) =>
  zones.find((z) => z.countries.includes(country)) ?? zones.find((z) => z.countries.length === 0)

/** Country-specific rates beat catch-all ones; then the lowest priority number wins. */
export const taxRateFor = (rules: StoreRules, country: string): TaxRateRule | undefined =>
  rules.tax?.rates
    .filter((r) => !r.country || r.country === country)
    .sort((a, b) => Number(Boolean(b.country)) - Number(Boolean(a.country)) || a.priority - b.priority)[0]

/** Discount in cents for an items subtotal. Zero when the coupon's spend limits aren't met. */
export const discountFor = (coupon: CouponTerms | null | undefined, subtotal: number, units: number): number => {
  if (!coupon || subtotal <= 0) return 0
  if (coupon.minimumSpend && subtotal < coupon.minimumSpend) return 0
  if (coupon.maximumSpend && subtotal > coupon.maximumSpend) return 0
  const raw =
    coupon.discountType === 'percent'
      ? Math.round((subtotal * Math.min(coupon.amount, 100)) / 100)
      : coupon.discountType === 'fixed_product'
        ? coupon.amount * units
        : coupon.amount
  return Math.max(0, Math.min(raw, subtotal))
}

type QuoteInput = {
  rules: StoreRules
  /** Items and paid extras, in cents, before any discount. */
  subtotal: number
  /** Units in the cart, for per-item shipping and fixed product discounts. */
  units: number
  country: string
  optionId?: string
  coupon?: CouponTerms | null
  formatPrice: (cents: number) => string
  /** False before an option is chosen (the cart): options are listed but nothing is charged. */
  withShipping?: boolean
}

export function quote({ rules, subtotal, units, country, optionId, coupon, formatPrice, withShipping = true }: QuoteInput): Quote {
  const discount = discountFor(coupon, subtotal, units)
  const afterDiscount = subtotal - discount
  const zone = matchZone(rules.zones, country)

  const options: ShippingOption[] = (zone?.methods ?? []).map((m) => {
    if (m.kind === 'local_pickup') return { id: m.id, title: m.title, details: m.details, method: 'collect', price: m.cost, taxable: true, available: true }
    if (m.kind === 'flat_rate')
      return { id: m.id, title: m.title, details: m.details, method: 'deliver', price: m.cost + m.perItem * units, taxable: m.taxable, available: true }
    const base = m.ignoreDiscounts ? subtotal : afterDiscount
    const minOk = base >= m.minAmount
    const couponOk = Boolean(coupon?.freeShipping)
    const available =
      m.requires === 'none' || (m.requires === 'min_amount' && minOk) || (m.requires === 'coupon' && couponOk) || (m.requires === 'either' && (minOk || couponOk)) || (m.requires === 'both' && minOk && couponOk)
    const hint = available
      ? undefined
      : m.requires === 'coupon'
        ? 'With a free shipping coupon'
        : !minOk
          ? `Spend ${formatPrice(m.minAmount - base)} more${m.requires === 'both' ? ' and use a free shipping coupon' : ''}`
          : 'With a free shipping coupon'
    return { id: m.id, title: m.title, method: 'deliver', price: 0, taxable: false, available, hint }
  })

  const usable = options.filter((o) => o.available)
  const selected = withShipping ? (usable.find((o) => o.id === optionId) ?? usable[0]) : undefined
  const shipping = selected?.price ?? 0

  const rate = taxRateFor(rules, country)
  let tax: Quote['tax'] = null
  if (rules.tax && rate && rate.rate > 0) {
    const base = afterDiscount + (rate.shipping && selected?.taxable ? shipping : 0)
    const amount = rules.tax.inclusive ? Math.round(base - base / (1 + rate.rate / 100)) : Math.round((base * rate.rate) / 100)
    tax = { name: rate.name, rate: rate.rate, amount, inclusive: rules.tax.inclusive }
  }

  const total = afterDiscount + shipping + (tax && !tax.inclusive ? tax.amount : 0)
  return { zone: zone?.name, options, selected, discount, shipping, tax, total }
}
