import type { Payload, PayloadRequest } from 'payload'
import { WIZARDS } from './wizards'
import type { ResolvedSlugs, SetupClientState, StoreSetupPluginOptions, TaskState } from './types'

/** Plugin options resolved once in `storeSetupPlugin` and stashed on the config `custom` key. */
export type ResolvedOptions = StoreSetupPluginOptions & { slugs: ResolvedSlugs; productsCollection: string }

export const OPTIONS_KEY = 'storeSetup'

export const resolvedOptions = (payload: Payload): ResolvedOptions => {
  const opts = (payload.config.custom as Record<string, unknown> | undefined)?.[OPTIONS_KEY]
  if (!opts) throw new Error('storeSetupPlugin is not registered in payload.config')
  return opts as ResolvedOptions
}

export const canManageStore = async (req: PayloadRequest, opts: ResolvedOptions) =>
  Boolean(req.user) && (opts.access ? await opts.access({ req }) : true)

/** The store settings global, read with full access (safe for storefront code). */
export const getStoreSettings = async (payload: Payload): Promise<Record<string, any>> => {
  const { slugs } = resolvedOptions(payload)
  return (await payload.findGlobal({ slug: slugs.settings as any, depth: 1, overrideAccess: true })) as Record<string, any>
}

const stripeMode = (): SetupClientState['env']['stripe'] => {
  const key = process.env.STRIPE_SECRET_KEY ?? ''
  if (key.startsWith('sk_live') || key.startsWith('rk_live')) return 'live'
  if (key.startsWith('sk_test') || key.startsWith('rk_test')) return 'test'
  return 'missing'
}

export const environment = (payload: Payload): SetupClientState['env'] => ({
  stripe: stripeMode(),
  paypal: Boolean(process.env.PAYPAL_CLIENT_ID),
  email: Boolean(payload.config.email),
})

export const countRecords = async (payload: Payload, opts: ResolvedOptions) => {
  const count = (collection: string, where?: Record<string, unknown>) =>
    payload
      .count({ collection: collection as any, where: where as any, overrideAccess: true })
      .then((r) => r.totalDocs)
      .catch(() => 0)
  const [products, taxRates, shippingZones, coupons] = await Promise.all([
    count(opts.productsCollection),
    count(opts.slugs.taxRates),
    count(opts.slugs.shippingZones, { 'methods.blockType': { exists: true } }),
    count(opts.slugs.coupons),
  ])
  return { products, taxRates, shippingZones, coupons }
}

const paymentsReady = (payments: Record<string, any> = {}, env: SetupClientState['env']) =>
  (payments.stripe?.enabled && env.stripe !== 'missing') ||
  (payments.paypal?.enabled && env.paypal) ||
  (payments.bacs?.enabled && (payments.bacs.accounts?.length ?? 0) > 0) ||
  payments.cheque?.enabled ||
  payments.cod?.enabled

/**
 * Task completion, in the spirit of WooCommerce's `is_complete()` per task: data-driven
 * where the data says enough (a product exists, a gateway is enabled), otherwise the
 * wizard's own "finish" marks it done.
 */
export const computeTasks = (
  settings: Record<string, any>,
  counts: SetupClientState['counts'],
  env: SetupClientState['env'],
): TaskState[] => {
  const marked: Record<string, { status?: string }> = settings.setup?.tasks ?? {}
  const done = (id: string) => marked[id]?.status === 'complete'
  const types: string[] = settings.profile?.productTypes ?? []
  const shipsPhysical = types.length === 0 || types.includes('physical') || types.includes('bundles')

  const complete: Record<string, boolean> = {
    'store-profile': Boolean(settings.profile?.completedAt),
    'location-currency': done('location-currency'),
    products: counts.products > 0,
    payments: Boolean(paymentsReady(settings.payments, env)),
    tax: done('tax') || (Boolean(settings.tax?.enabled) && counts.taxRates > 0),
    shipping: done('shipping') || counts.shippingZones > 0,
    launch: settings.visibility?.mode === 'live',
    inventory: done('inventory'),
    checkout: done('checkout'),
    emails: done('emails'),
    brand: done('brand'),
    marketing: done('marketing') || counts.coupons > 0,
  }

  return WIZARDS.map((w) => ({
    id: w.id,
    complete: complete[w.id] ?? false,
    skipped: !complete[w.id] && marked[w.id]?.status === 'skipped',
    // Like WooCommerce, the shipping task disappears for stores that only sell non-physical goods.
    visible: w.id === 'shipping' ? shipsPhysical && settings.general?.shipTo !== 'disabled' : true,
  }))
}

/** The settings global with visibility taken from the host app's adapter, when there is one. */
export const readStoreSettings = async (req: PayloadRequest, opts: ResolvedOptions, depth = 1) => {
  const settings = (await req.payload.findGlobal({ slug: opts.slugs.settings as any, depth, overrideAccess: true, req })) as Record<string, any>
  if (!opts.visibility) return settings
  return { ...settings, visibility: { ...settings.visibility, mode: await opts.visibility.read(req) } }
}

export const buildClientState = async (req: PayloadRequest, opts: ResolvedOptions): Promise<SetupClientState> => {
  const { payload } = req
  const settings = await readStoreSettings(req, opts)
  const [counts, env] = [await countRecords(payload, opts), environment(payload)]
  return {
    apiRoute: payload.config.routes.api,
    adminRoute: payload.config.routes.admin,
    slugs: opts.slugs,
    productsCollection: opts.productsCollection,
    ownsProducts: !opts.products,
    uploadsCollection: opts.uploadsCollection,
    settings,
    tasks: computeTasks(settings, counts, env),
    counts,
    env,
    userEmail: (req.user as { email?: string } | null)?.email,
  }
}

// Storefront helpers.

export { formatPrice } from './format'

/**
 * Whether a visitor may see store pages, honouring "coming soon" mode. Staff (anyone the
 * plugin's `access` lets in) and visitors with the preview token always can.
 */
export const canViewStore = (args: {
  settings: Record<string, any>
  isStaff: boolean
  previewToken?: string | null
  area: 'store' | 'site'
}): boolean => {
  const v = args.settings.visibility ?? {}
  if (v.mode === 'live' || args.isStaff) return true
  if (v.previewToken && args.previewToken === v.previewToken) return true
  return args.area === 'site' ? v.scope !== 'site' : false
}
