import { unstable_cache } from 'next/cache'
import { getPayload, type Payload } from 'payload'
import config from '@payload-config'
import { COUNTRIES, countryName } from '@/packages/payload-plugin-store-setup/src/reference'
import { getGeneralGlobal } from '@/lib/utils/payload/globals'
import { contentTag } from '@/lib/utils/payload/tags'
import type { ShopSettings } from './settings'
import { STORE_SLUGS } from './storeSlugs'
import type { CouponTerms, ShippingMethodRule, StoreRules, TaxRateRule, ZoneRule } from './pricing'


const FALLBACK_COUNTRY = 'MT'

/** Site Settings → Shop as zones: collection, plus delivery when it's switched on. */
const legacyZones = (shop: ShopSettings): ZoneRule[] => [
  {
    name: 'Malta',
    countries: [],
    methods: [
      {
        id: 'collect',
        kind: 'local_pickup',
        title: shop.collection.label,
        cost: 0,
        details: [shop.collection.details, shop.collection.readyIn ? `Usually ready in ${shop.collection.readyIn}.` : ''].filter(Boolean).join(' '),
      },
      ...(shop.delivery.enabled
        ? [{ id: 'deliver', kind: 'flat_rate', title: 'Delivery', cost: shop.delivery.fee, perItem: 0, taxable: true, details: shop.delivery.details } as const]
        : []),
    ],
  },
]

const toMethod = (block: any, i: number): ShippingMethodRule | null => {
  const id = String(block.id ?? `${block.blockType}-${i}`)
  const cost = Math.max(0, Math.round(Number(block.cost) || 0))
  switch (block.blockType) {
    case 'local_pickup':
      return { id, kind: 'local_pickup', title: block.title || 'Local pickup', cost, details: block.instructions || undefined }
    case 'flat_rate':
      return { id, kind: 'flat_rate', title: block.title || 'Flat rate', cost, perItem: Math.max(0, Math.round(Number(block.perItem) || 0)), taxable: block.taxStatus !== 'none' }
    case 'free_shipping':
      return {
        id,
        kind: 'free_shipping',
        title: block.title || 'Free shipping',
        requires: block.requires || 'none',
        minAmount: Math.max(0, Math.round(Number(block.minAmount) || 0)),
        ignoreDiscounts: Boolean(block.ignoreDiscounts),
      }
    default:
      return null
  }
}

/** Countries the store sells to (Store Settings → General), for the catch-all zone. */
const sellingCountries = (general: Record<string, any> = {}): string[] => {
  if (general.sellingLocations === 'specific') return general.sellingSpecific ?? []
  const except: string[] = general.sellingLocations === 'all_except' ? (general.sellingExcept ?? []) : []
  return COUNTRIES.map((c) => c.value).filter((c) => !except.includes(c))
}

async function loadRules(payload: Payload): Promise<StoreRules> {
  const [{ shop }, settings, zoneDocs, rateDocs, couponCount] = await Promise.all([
    getGeneralGlobal(),
    payload.findGlobal({ slug: STORE_SLUGS.settings as any, depth: 0, overrideAccess: true }) as Promise<Record<string, any>>,
    payload.find({ collection: STORE_SLUGS.shippingZones as any, sort: 'order', limit: 100, depth: 0, overrideAccess: true }),
    payload.find({ collection: STORE_SLUGS.taxRates as any, limit: 500, depth: 0, overrideAccess: true }),
    payload.count({ collection: STORE_SLUGS.coupons as any, overrideAccess: true }),
  ])

  const zones: ZoneRule[] = (zoneDocs.docs as any[])
    .map((z) => ({ name: z.name, countries: z.countries ?? [], methods: (z.methods ?? []).map(toMethod).filter(Boolean) as ShippingMethodRule[] }))
    .filter((z) => z.methods.length > 0)
  const useZones = zones.length > 0

  // Store setup owns tax once its tax wizard has been finished (including "I don't charge tax").
  const taxSettings = settings.tax ?? {}
  const taxDone = settings.setup?.tasks?.tax?.status === 'complete'
  const useStoreTax = Boolean(taxSettings.enabled) || taxDone
  const rates: TaxRateRule[] = (rateDocs.docs as any[])
    .filter((r) => !r.taxClass || r.taxClass === 'standard')
    .map((r) => ({ country: r.country || undefined, rate: Number(r.rate) || 0, name: r.name || 'Tax', priority: Number(r.priority) || 1, shipping: r.shipping !== false }))

  const defaultCountry: string = settings.general?.country || FALLBACK_COUNTRY
  const codes = useZones
    ? [...new Set(zones.some((z) => z.countries.length === 0) ? sellingCountries(settings.general) : zones.flatMap((z) => z.countries))]
    : [defaultCountry]
  const countries = [defaultCountry, ...codes.filter((c) => c !== defaultCountry).sort((a, b) => countryName(a).localeCompare(countryName(b)))].map((value) => ({
    value,
    label: countryName(value),
  }))

  return {
    source: { shipping: useZones ? 'store-setup' : 'site-settings', tax: useStoreTax ? 'store-setup' : 'site-settings' },
    defaultCountry,
    countries,
    zones: useZones ? zones : legacyZones(shop),
    tax: useStoreTax
      ? taxSettings.enabled && rates.length
        ? { inclusive: taxSettings.pricesIncludeTax === 'yes', rates }
        : null
      : shop.vatRate > 0
        ? { inclusive: true, rates: [{ rate: shop.vatRate, name: 'VAT', priority: 1, shipping: true }] }
        : null,
    coupons: settings.marketing?.couponsEnabled !== false && couponCount.totalDocs > 0,
  }
}

const loadRulesCached = unstable_cache(async () => loadRules(await getPayload({ config })), ['store-rules'], {
  revalidate: 60,
  tags: ['global:general', ...Object.values(STORE_SLUGS).map(contentTag)],
})

/** Shipping, tax and coupon rules for the storefront. Cached; cleared when any of them change. */
export const getStoreRules = () => loadRulesCached()

/** Fresh rules for checkout, where a stale rate would charge the wrong amount. */
export const getStoreRulesUncached = async () => loadRules(await getPayload({ config }))

const PAID = ['paid', 'ready', 'shipped', 'fulfilled']

const emailAllowed = (patterns: string | null | undefined, email: string) => {
  const list = String(patterns ?? '')
    .split(',')
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean)
  if (!list.length) return true
  const e = email.trim().toLowerCase()
  return list.some((p) => new RegExp(`^${p.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`).test(e))
}

/**
 * Looks up a Store setup coupon and checks it can be used for this order. `email` may be
 * empty while the buyer is still typing; the per-customer checks then wait for checkout.
 */
export async function validateCoupon(
  payload: Payload,
  code: string,
  { subtotal, email, formatPrice }: { subtotal: number; email: string; formatPrice: (cents: number) => string },
): Promise<{ ok: true; coupon: CouponTerms } | { ok: false; error: string }> {
  const normalised = code.trim().toLowerCase()
  if (!normalised) return { ok: false, error: 'Enter a coupon code.' }
  const settings = (await payload.findGlobal({ slug: STORE_SLUGS.settings as any, depth: 0, overrideAccess: true })) as Record<string, any>
  if (settings.marketing?.couponsEnabled === false) return { ok: false, error: 'Coupons are not accepted right now.' }

  const { docs } = await payload.find({ collection: STORE_SLUGS.coupons as any, where: { code: { equals: normalised } }, limit: 1, depth: 0, overrideAccess: true })
  const c = docs[0] as Record<string, any> | undefined
  if (!c) return { ok: false, error: `“${code.trim()}” isn't a valid coupon.` }
  // The expiry date is a day: the coupon works until the end of it.
  if (c.expiresAt && new Date(c.expiresAt).getTime() + 24 * 60 * 60 * 1000 <= Date.now()) return { ok: false, error: 'This coupon has expired.' }
  if (c.usageLimit && (Number(c.usageCount) || 0) >= c.usageLimit) return { ok: false, error: 'This coupon has been used up.' }
  if (c.minimumSpend && subtotal < c.minimumSpend) return { ok: false, error: `Spend at least ${formatPrice(c.minimumSpend)} to use this coupon.` }
  if (c.maximumSpend && subtotal > c.maximumSpend) return { ok: false, error: `This coupon is for orders up to ${formatPrice(c.maximumSpend)}.` }
  if (email) {
    if (!emailAllowed(c.allowedEmails, email)) return { ok: false, error: "This coupon isn't valid for your email address." }
    if (c.usageLimitPerUser) {
      const { totalDocs } = await payload.count({
        collection: 'orders',
        where: { couponCode: { equals: normalised }, customerEmail: { equals: email.trim() }, status: { in: PAID } },
        overrideAccess: true,
      })
      if (totalDocs >= c.usageLimitPerUser) return { ok: false, error: "You've already used this coupon." }
    }
  }
  return {
    ok: true,
    coupon: {
      code: normalised,
      discountType: c.discountType,
      amount: Number(c.amount) || 0,
      freeShipping: Boolean(c.freeShipping),
      minimumSpend: c.minimumSpend ?? null,
      maximumSpend: c.maximumSpend ?? null,
    },
  }
}

/** Counts a use once the order is paid. */
export async function recordCouponUse(payload: Payload, code: string | null | undefined) {
  if (!code) return
  const { docs } = await payload.find({ collection: STORE_SLUGS.coupons as any, where: { code: { equals: code } }, limit: 1, depth: 0, overrideAccess: true })
  const c = docs[0] as Record<string, any> | undefined
  if (c) await payload.update({ collection: STORE_SLUGS.coupons as any, id: c.id, data: { usageCount: (Number(c.usageCount) || 0) + 1 }, overrideAccess: true })
}
