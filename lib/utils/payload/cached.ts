import { unstable_cache } from 'next/cache'
import { getPayload, type CollectionSlug, type Payload, type TypedCollection } from 'payload'
import type { PaginatedDocs } from 'payload'
import config from '@payload-config'
import { CONTENT_TAG } from './tags'


type FindArgs = Parameters<Payload['find']>[0]

const run = unstable_cache(
  async (args: FindArgs) => {
    const payload = await getPayload({ config })
    return payload.find(args)
  },
  ['payload-find'],
  { revalidate: 60, tags: [CONTENT_TAG] },
)

/**
 * `payload.find` for public, read-only content. Results are cached for 60 seconds and cleared
 * straight away when content is saved in the admin. The arguments are part of the cache key,
 * so they must be plain serialisable values. Do not use for drafts, per-user or write paths.
 */
export async function cachedFind<T extends CollectionSlug>(
  args: FindArgs & { collection: T },
): Promise<PaginatedDocs<TypedCollection[T]>> {
  return (await run(args)) as unknown as PaginatedDocs<TypedCollection[T]>
}
