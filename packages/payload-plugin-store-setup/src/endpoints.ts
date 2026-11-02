import { addDataAndFileToRequest, deepMergeWithSourceArrays, type Endpoint, type PayloadRequest } from 'payload'
import { buildClientState, canManageStore, readStoreSettings, resolvedOptions, type ResolvedOptions } from './server'
import type { WizardProductInput } from './types'
import { wizardById } from './wizards'

const SYSTEM_KEYS = ['id', 'createdAt', 'updatedAt', 'globalType', '_status']

const strip = (doc: Record<string, any>) => Object.fromEntries(Object.entries(doc).filter(([k]) => !SYSTEM_KEYS.includes(k)))

/** Upload relations come back populated at depth 1; send ids back so the update validates. */
const idsForUploads = (value: any): any => {
  if (Array.isArray(value)) return value.map(idsForUploads)
  if (value && typeof value === 'object') {
    if ('filename' in value && 'id' in value) return value.id
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, idsForUploads(v)]))
  }
  return value
}

type Handler = (req: PayloadRequest, opts: ResolvedOptions, body: Record<string, any>) => Promise<Response>

const guarded =
  (handler: Handler) =>
  async (req: PayloadRequest): Promise<Response> => {
    const opts = resolvedOptions(req.payload)
    if (!(await canManageStore(req, opts))) return Response.json({ error: 'Forbidden' }, { status: 403 })
    if (req.method !== 'GET') await addDataAndFileToRequest(req)
    try {
      return await handler(req, opts, (req.data as Record<string, any>) ?? {})
    } catch (err) {
      req.payload.logger.error({ err, msg: 'store-setup endpoint failed' })
      return Response.json({ error: err instanceof Error ? err.message : 'Something went wrong' }, { status: 400 })
    }
  }

const readSettings = async (req: PayloadRequest, opts: ResolvedOptions) =>
  (await req.payload.findGlobal({ slug: opts.slugs.settings as any, depth: 1, overrideAccess: true, req })) as Record<string, any>

/** Deep-merges a partial settings object into the global. Arrays in the patch replace stored ones. */
export const patchSettings = async (req: PayloadRequest, opts: ResolvedOptions, patch: Record<string, any>) => {
  const previous = await readSettings(req, opts)
  const merged = deepMergeWithSourceArrays<Record<string, any>>(idsForUploads(strip(previous)), idsForUploads(patch))
  const settings = (await req.payload.updateGlobal({
    slug: opts.slugs.settings as any,
    data: merged,
    depth: 1,
    overrideAccess: true,
    req,
  })) as Record<string, any>
  await opts.onSettingsChange?.({ settings, previous, req })
  return settings
}

const markTask = (id: string, status: 'complete' | 'skipped' | null) => ({
  setup: { tasks: { [id]: status ? { status, at: new Date().toISOString() } : null } },
})

const state = async (req: PayloadRequest, opts: ResolvedOptions) => Response.json(await buildClientState(req, opts))

/** POST { patch, complete?: wizardId } */
const saveSettings: Handler = async (req, opts, body) => {
  const patch = { ...(body.patch ?? {}) }
  if (body.complete) {
    if (!wizardById(body.complete)) throw new Error(`Unknown task ${body.complete}`)
    Object.assign(patch, deepMergeWithSourceArrays(patch, markTask(body.complete, 'complete')))
  }
  await patchSettings(req, opts, patch)
  return state(req, opts)
}

/** POST { id, action: 'complete' | 'skip' | 'reopen' } */
const updateTask: Handler = async (req, opts, body) => {
  if (!wizardById(body.id)) throw new Error(`Unknown task ${body.id}`)
  const status = body.action === 'complete' ? 'complete' : body.action === 'skip' ? 'skipped' : null
  await patchSettings(req, opts, markTask(body.id, status))
  return state(req, opts)
}

/** POST { hidden: boolean } — WooCommerce's "Hide this" on the task list. */
const toggleTaskList: Handler = async (req, opts, body) => {
  await patchSettings(req, opts, { setup: { taskListHidden: Boolean(body.hidden) } })
  return state(req, opts)
}

const createProducts = async (req: PayloadRequest, opts: ResolvedOptions, products: WizardProductInput[]) => {
  const created: { id: string | number; name: string }[] = []
  for (const product of products) {
    const data = opts.products
      ? await opts.products.toDocument(product, req)
      : {
          ...product,
          length: product.dimensions?.length,
          width: product.dimensions?.width,
          height: product.dimensions?.height,
          attributes: product.attributes?.map((a) => ({ name: a.name, values: a.values.join(' | ') })),
        }
    const doc = await req.payload.create({ collection: opts.productsCollection as any, data, overrideAccess: true, req })
    created.push({ id: doc.id, name: product.name })
  }
  return created
}

const RECORD_COLLECTIONS = ['taxRates', 'shippingZones', 'coupons'] as const

/**
 * POST { kind: 'products' | 'taxRates' | 'shippingZones' | 'coupons', docs: [], replace?: boolean, complete?: wizardId }
 * `replace` clears the plugin's own collection first (never used for products).
 */
const saveRecords: Handler = async (req, opts, body) => {
  const docs: Record<string, any>[] = Array.isArray(body.docs) ? body.docs : []
  let created: { id: string | number; name?: string }[] = []
  if (body.kind === 'products') {
    created = await createProducts(req, opts, docs as WizardProductInput[])
  } else if (RECORD_COLLECTIONS.includes(body.kind)) {
    const collection = opts.slugs[body.kind as (typeof RECORD_COLLECTIONS)[number]] as any
    if (body.replace) await req.payload.delete({ collection, where: { id: { exists: true } }, overrideAccess: true, req })
    for (const data of docs) {
      const doc = await req.payload.create({ collection, data: strip(data), overrideAccess: true, req })
      created.push({ id: doc.id })
    }
  } else {
    throw new Error(`Unknown record kind ${body.kind}`)
  }
  if (body.complete) await patchSettings(req, opts, markTask(body.complete, 'complete'))
  const next = await buildClientState(req, opts)
  return Response.json({ ...next, created })
}

/** GET ?kind=taxRates|shippingZones|coupons — existing rows, so wizards can edit instead of duplicate. */
const listRecords: Handler = async (req, opts) => {
  const kind = new URL(req.url ?? '', 'http://x').searchParams.get('kind') as (typeof RECORD_COLLECTIONS)[number]
  if (!RECORD_COLLECTIONS.includes(kind)) throw new Error('Unknown kind')
  const { docs } = await req.payload.find({ collection: opts.slugs[kind] as any, limit: 200, depth: 0, overrideAccess: true, req })
  return Response.json({ docs })
}

/** POST { to } — sends a sample order email styled with the current email settings. */
const testEmail: Handler = async (req, opts, body) => {
  const settings = await readSettings(req, opts)
  const e = settings.emails ?? {}
  const name = settings.profile?.storeName || 'Your store'
  const to = String(body.to || (req.user as any)?.email || '')
  if (!to) throw new Error('No recipient')
  await req.payload.sendEmail({
    to,
    ...(e.fromAddress ? { from: e.fromName ? `"${e.fromName}" <${e.fromAddress}>` : e.fromAddress } : {}),
    subject: `[${name}] Test email: your order has been received`,
    html: `<div style="background:${e.backgroundColor ?? '#f7f7f7'};padding:32px;font-family:Helvetica,Arial,sans-serif">
      <div style="max-width:560px;margin:auto;background:${e.bodyColor ?? '#fff'};color:${e.textColor ?? '#3c3c3c'}">
        <div style="background:${e.baseColor ?? '#720eec'};color:#fff;padding:28px 32px;font-size:24px">Thank you for your order</div>
        <div style="padding:32px;line-height:1.5">This is a test email from the ${name} setup wizard. Order emails will use these colours and sender details.</div>
      </div>
      <p style="text-align:center;color:#888;font-size:12px">${String(e.footerText ?? '').replace('{site_title}', name)}</p>
    </div>`,
  })
  return Response.json({ ok: true, to })
}

/** POST { mode, scope?, message? } — switches coming soon / live and issues a preview token. */
const launch: Handler = async (req, opts, body) => {
  const current = (await readStoreSettings(req, opts)).visibility ?? {}
  const live = body.mode === 'live'
  await patchSettings(req, opts, {
    visibility: {
      mode: live ? 'live' : 'coming_soon',
      ...(body.scope ? { scope: body.scope } : {}),
      ...(typeof body.message === 'string' ? { message: body.message } : {}),
      previewToken: current.previewToken || crypto.randomUUID().replace(/-/g, '').slice(0, 16),
      launchedAt: live ? (current.launchedAt ?? new Date().toISOString()) : current.launchedAt,
    },
    ...(live ? markTask('launch', 'complete') : {}),
  })
  await opts.visibility?.write(live ? 'live' : 'coming_soon', req)
  return state(req, opts)
}

export const storeSetupEndpoints = (): Endpoint[] => [
  { path: '/store-setup/state', method: 'get', handler: guarded((req, opts) => state(req, opts)) },
  { path: '/store-setup/settings', method: 'post', handler: guarded(saveSettings) },
  { path: '/store-setup/task', method: 'post', handler: guarded(updateTask) },
  { path: '/store-setup/task-list', method: 'post', handler: guarded(toggleTaskList) },
  { path: '/store-setup/records', method: 'get', handler: guarded(listRecords) },
  { path: '/store-setup/records', method: 'post', handler: guarded(saveRecords) },
  { path: '/store-setup/test-email', method: 'post', handler: guarded(testEmail) },
  { path: '/store-setup/launch', method: 'post', handler: guarded(launch) },
]
