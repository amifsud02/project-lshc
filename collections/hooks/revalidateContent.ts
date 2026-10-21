import { revalidatePath, revalidateTag } from 'next/cache'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, Config, Plugin } from 'payload'

import { contentTag } from '@/lib/utils/payload/tags'

/** Public content collections: changing any of them refreshes the cached site. */
const CONTENT_COLLECTIONS = [
  'pages',
  'news',
  'news-categories',
  'fixtures',
  'standings',
  'players',
  'teams',
  'competitions',
  'competitionTypes',
  'galleries',
  'gallery-categories',
  'videos',
  'venues',
  'products',
  'media',
  'nursery-seasons',
  'nursery-categories',
  'advertisements',
  'promotions',
]

/**
 * Collections only shown through `cachedFind`. Clearing their tag already refreshes every page
 * that shows them, so saving one doesn't throw away the rest of the site's cached pages.
 */
const TAG_ONLY_COLLECTIONS = ['products', 'advertisements', 'promotions']

/**
 * Clears the cached queries that can contain `collection`'s documents and, unless it is in
 * TAG_ONLY_COLLECTIONS, the cached pages too (some pages read Payload directly).
 * Safe to call outside a Next request (seed scripts).
 */
export const refreshSite = (collection: string) => {
  try {
    revalidateTag(contentTag(collection))
    if (!TAG_ONLY_COLLECTIONS.includes(collection)) revalidatePath('/', 'layout')
  } catch {
    // Not running inside Next (e.g. `payload run` scripts): nothing is cached, nothing to clear.
  }
}

const afterChange: CollectionAfterChangeHook = ({ doc, collection }) => {
  refreshSite(collection.slug)
  return doc
}

const afterDelete: CollectionAfterDeleteHook = ({ doc, collection }) => {
  refreshSite(collection.slug)
  return doc
}

/** Adds the refresh hooks to every public content collection in one place. */
export const revalidateContentPlugin: Plugin = (incoming: Config): Config => ({
  ...incoming,
  collections: (incoming.collections ?? []).map((collection) =>
    CONTENT_COLLECTIONS.includes(collection.slug)
      ? {
          ...collection,
          hooks: {
            ...collection.hooks,
            afterChange: [...(collection.hooks?.afterChange ?? []), afterChange],
            afterDelete: [...(collection.hooks?.afterDelete ?? []), afterDelete],
          },
        }
      : collection,
  ),
})
