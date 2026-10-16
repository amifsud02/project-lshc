import { unstable_cache } from 'next/cache'
import { getPayload, type CollectionSlug, type Payload, type TypedCollection, type Where } from 'payload'
import type { PaginatedDocs } from 'payload'
import config from '@payload-config'
import { contentDependencies } from './dependencies'
import { contentTag } from './tags'


type FindArgs = Parameters<Payload['find']>[0]
type Runner = (args: FindArgs) => Promise<PaginatedDocs>

const runners = new Map<string, Runner>()

/**
 * One cache per collection, tagged with every collection its results can contain, so saving
 * a news post leaves the cached products alone but replacing a product image refreshes them.
 */
async function runnerFor(collection: string): Promise<Runner> {
  const existing = runners.get(collection)
  if (existing) return existing

  const tags = contentDependencies(await config, collection).map(contentTag)
  const run = unstable_cache(
    async (args: FindArgs) => {
      const payload = await getPayload({ config })
      return payload.find(args)
    },
    ['payload-find', collection],
    { revalidate: 60, tags },
  )
  runners.set(collection, run)
  return run
}

/**
 * `payload.find` for public, read-only content. Results are cached for 60 seconds and cleared
 * straight away when content is saved in the admin. The arguments are part of the cache key,
 * so they must be plain serialisable values. Only published documents are returned from
 * collections with drafts. Do not use for drafts, per-user or write paths.
 */
export async function cachedFind<T extends CollectionSlug>(
  args: FindArgs & { collection: T },
): Promise<PaginatedDocs<TypedCollection[T]>> {
  const run = await runnerFor(args.collection)
  return (await run(await publishedOnly(args))) as unknown as PaginatedDocs<TypedCollection[T]>
}

const PUBLISHED: Where = { _status: { equals: 'published' } }

/**
 * The Local API skips access control, so on collections with drafts it would return posts that
 * were never published or have been unpublished. Only published documents belong on the site.
 */
async function publishedOnly(args: FindArgs): Promise<FindArgs> {
  const collection = (await config).collections.find((c) => c.slug === args.collection)
  if (!collection?.versions?.drafts) return args
  return { ...args, where: args.where ? { and: [args.where, PUBLISHED] } : PUBLISHED }
}
