import { revalidatePath, revalidateTag } from 'next/cache'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, Config, Plugin } from 'payload'

import { CONTENT_TAG } from '@/lib/utils/payload/tags'

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
  'venues',
  'products',
  'media',
  'nursery-seasons',
  'nursery-categories',
]

/** Clears the shared query cache and the cached pages. Safe to call outside a Next request (seed scripts). */
export const refreshSite = () => {
  try {
    revalidateTag(CONTENT_TAG)
    revalidatePath('/', 'layout')
  } catch {
    // Not running inside Next (e.g. `payload run` scripts): nothing is cached, nothing to clear.
  }
}

const afterChange: CollectionAfterChangeHook = ({ doc }) => {
  refreshSite()
  return doc
}

const afterDelete: CollectionAfterDeleteHook = ({ doc }) => {
  refreshSite()
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
