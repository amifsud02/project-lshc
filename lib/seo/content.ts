// Public content listings for the sitemap, llms.txt and the news feed. Queries run with
// `overrideAccess: false` and no user, so only what a visitor can see is listed.
import { getPayload, type CollectionSlug, type Where } from 'payload'
import config from '@payload-config'
import type { News } from '@/payload-types'
import { venueName } from '@/lib/fixtures/venues'
import { paths } from './site'

export type ContentEntry = { path: string; lastModified?: string }

const PUBLIC = { overrideAccess: false } as const

async function list<T = any>(
  collection: CollectionSlug,
  opts: { where?: Where; select?: Record<string, true>; depth?: number; limit?: number; sort?: string } = {},
): Promise<T[]> {
  try {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection,
      depth: opts.depth ?? 0,
      limit: opts.limit ?? 5000,
      pagination: false,
      sort: opts.sort,
      where: opts.where,
      select: opts.select as any,
      ...PUBLIC,
    })
    return docs as T[]
  } catch (err) {
    // A listing that fails to load is left out rather than failing the whole response.
    console.error(`[seo] could not list ${collection}`, err)
    return []
  }
}

export async function listPages(): Promise<ContentEntry[]> {
  const docs = await list('pages', {
    where: { noIndex: { not_equals: true } },
    select: { slug: true, updatedAt: true },
  })
  return docs.map((d) => ({ path: paths.page(d.slug), lastModified: d.updatedAt }))
}

export async function listNews(limit?: number): Promise<News[]> {
  return list<News>('news', {
    depth: 1,
    limit,
    sort: '-publishedAt',
    select: { title: true, slug: true, category: true, description: true, publishedAt: true, updatedAt: true, tags: true, featuredImage: true, meta: true } as any,
  })
}

export async function listNewsEntries(): Promise<ContentEntry[]> {
  const docs = await list('news', { depth: 1, select: { slug: true, category: true, updatedAt: true } })
  return docs.flatMap((d) => {
    const path = paths.news(d)
    return path ? [{ path, lastModified: d.updatedAt }] : []
  })
}

export async function listNewsCategories(): Promise<ContentEntry[]> {
  const docs = await list('news-categories', { select: { slug: true, updatedAt: true } })
  return docs.filter((d) => d.slug).map((d) => ({ path: paths.newsCategory(d.slug), lastModified: d.updatedAt }))
}

export async function listGalleries(): Promise<ContentEntry[]> {
  const [galleries, categories] = await Promise.all([
    list('galleries', { depth: 1, select: { slug: true, tag: true, updatedAt: true } }),
    list('gallery-categories', { select: { slug: true, updatedAt: true } }),
  ])
  return [
    ...categories.filter((d) => d.slug).map((d) => ({ path: paths.galleryCategory(d.slug), lastModified: d.updatedAt })),
    ...galleries.flatMap((d) => {
      const path = paths.gallery(d)
      return path ? [{ path, lastModified: d.updatedAt }] : []
    }),
  ]
}

export async function listVideos(): Promise<ContentEntry[]> {
  const docs = await list('videos', { select: { slug: true, updatedAt: true } })
  return docs.filter((d) => d.slug).map((d) => ({ path: paths.video(d.slug), lastModified: d.updatedAt }))
}

export async function listFixtures(): Promise<ContentEntry[]> {
  const docs = await list('fixtures', { select: { slug: true, updatedAt: true } })
  return docs.filter((d) => d.slug).map((d) => ({ path: paths.fixture(d.slug), lastModified: d.updatedAt }))
}

/** Only players whose profile page is switched on have a public page. */
export async function listPlayers(): Promise<ContentEntry[]> {
  const docs = await list('players', {
    where: { profilePage: { equals: true } },
    select: { slug: true, updatedAt: true },
  })
  return docs.filter((d) => d.slug).map((d) => ({ path: paths.player(d.slug), lastModified: d.updatedAt }))
}

export type UpcomingFixture ={ path: string; title: string; startDate: string; venue?: string }

export async function listUpcomingFixtures(limit = 10): Promise<UpcomingFixture[]> {
  const docs = await list('fixtures', {
    depth: 1,
    limit,
    sort: 'startDate',
    where: { startDate: { greater_than_equal: new Date().toISOString() } },
  })
  return docs
    .filter((d) => d.slug)
    .map((d) => {
      const team = (t: any) => (t && typeof t === 'object' ? t.teamName : undefined) ?? 'TBC'
      return {
        path: paths.fixture(d.slug),
        title: `${team(d.homeTeam)} vs ${team(d.awayTeam)}`,
        startDate: d.startDate,
        venue: venueName(d.venue),
      }
    })
}

export async function listProducts(): Promise<ContentEntry[]> {
  const docs = await list('products', { where: { active: { equals: true } }, select: { slug: true, updatedAt: true } })
  return docs.filter((d) => d.slug).map((d) => ({ path: paths.product(d.slug), lastModified: d.updatedAt }))
}
