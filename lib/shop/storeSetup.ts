import { revalidateTag } from 'next/cache'
import type { Config, Plugin, PayloadRequest } from 'payload'
import { storeSetupPlugin, type WizardProductInput } from '@/packages/payload-plugin-store-setup/src'
import { hasRole } from '@/lib/auth/roles'
import { contentTag } from '@/lib/utils/payload/tags'
import { STORE_SLUGS } from './storeSlugs'

const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

/** First free slug: "hoodie", then "hoodie-2", "hoodie-3"… */
const freeSlug = async (name: string, req: PayloadRequest) => {
  const base = slugify(name) || 'product'
  for (let n = 1; ; n++) {
    const slug = n === 1 ? base : `${base}-${n}`
    const { totalDocs } = await req.payload.count({ collection: 'products', where: { slug: { equals: slug } }, req })
    if (!totalDocs) return slug
  }
}

const paragraph = (text: string) => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: [
      {
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        textFormat: 0,
        children: [{ type: 'text', text, format: 0, style: '', mode: 'normal', detail: 0, version: 1 }],
      },
    ],
  },
})

/**
 * Maps a wizard product onto the club's Products collection. The shop has no sale prices,
 * so a sale price becomes the price; products start inactive unless published in the wizard.
 */
const toLshcProduct = async (p: WizardProductInput, req: PayloadRequest) => ({
  title: p.name,
  slug: await freeSlug(p.name, req),
  type: 'single',
  price: p.salePrice ?? p.regularPrice,
  active: p.status === 'published',
  ...(p.manageStock && p.stockQuantity != null && p.type !== 'variable' ? { stock: p.stockQuantity } : {}),
  // A variable product's attributes become real variants, one per combination (stock left to set per variant).
  ...(p.type === 'variable' && p.attributes?.length
    ? { variantOptions: p.attributes.slice(0, 3).map((a) => ({ name: a.name, values: a.values })), generateVariants: true }
    : {}),
  ...(p.shortDescription ? { description: paragraph(p.shortDescription) } : {}),
})

/**
 * The store setup wizard (Admin → Store setup), wired to the existing shop: products go into
 * `products`, and launching flips Site Settings → Shop → visibility.
 */
export const storeSetup = storeSetupPlugin({
  componentsPath: '@/packages/payload-plugin-store-setup/src/components',
  access: ({ req }) => hasRole(req.user, 'admin', 'shop-manager'),
  uploadsCollection: 'media',
  // The shop is already running, so don't hijack staff dashboards; the banner links to setup.
  firstRunRedirect: false,
  products: { collection: 'products', toDocument: toLshcProduct },
  visibility: {
    read: async (req) => {
      const general = await req.payload.findGlobal({ slug: 'general', depth: 0, overrideAccess: true, req })
      return general.shop?.visibility === 'public' ? 'live' : 'coming_soon'
    },
    // Global updates replace whole groups, so write the full document back.
    write: async (mode, req) => {
      const { id, createdAt, updatedAt, globalType, ...general } = (await req.payload.findGlobal({
        slug: 'general',
        depth: 0,
        overrideAccess: true,
        req,
      })) as Record<string, any>
      await req.payload.updateGlobal({
        slug: 'general',
        data: { ...general, shop: { ...general.shop, visibility: mode === 'live' ? 'public' : 'admins' } },
        overrideAccess: true,
        req,
      })
    },
  },
})

const clearStoreCache = (slug: string) => {
  try {
    revalidateTag(contentTag(slug))
  } catch {
    // Outside Next (`payload run` scripts) nothing is cached.
  }
}

/**
 * Clears the cached checkout rules (lib/shop/storeRules.ts) when Store Settings, shipping
 * zones, tax rates or coupons change, from the wizards or the admin. Register after `storeSetup`.
 */
export const storeCachePlugin: Plugin = (config: Config): Config => {
  const slugs: string[] = Object.values(STORE_SLUGS)
  const hook =
    (slug: string) =>
    ({ doc }: { doc: unknown }) => {
      clearStoreCache(slug)
      return doc
    }
  return {
    ...config,
    collections: (config.collections ?? []).map((c) =>
      slugs.includes(c.slug)
        ? { ...c, hooks: { ...c.hooks, afterChange: [...(c.hooks?.afterChange ?? []), hook(c.slug)], afterDelete: [...(c.hooks?.afterDelete ?? []), hook(c.slug)] } }
        : c,
    ),
    globals: (config.globals ?? []).map((g) =>
      slugs.includes(g.slug) ? { ...g, hooks: { ...g.hooks, afterChange: [...(g.hooks?.afterChange ?? []), hook(g.slug)] } } : g,
    ),
  }
}
