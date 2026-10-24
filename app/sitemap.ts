import type { MetadataRoute } from 'next'
import {
  listFixtures,
  listGalleries,
  listNewsCategories,
  listNewsEntries,
  listPages,
  listPlayers,
  listProducts,
  listVideos,
  type ContentEntry,
} from '@/lib/seo/content'
import { absoluteUrl } from '@/lib/seo/site'
import { getGeneralGlobal } from '@/lib/utils/payload/globals'

// Rebuilt at most hourly; new content appears in the sitemap within the hour.
export const revalidate = 3600

/** Routes built in code rather than from a CMS document. */
const STATIC_ROUTES: ContentEntry[] = [
  '/',
  '/news',
  '/news/gallery',
  '/tv',
  '/fixtures',
  '/contact',
  '/club/history',
  '/club/management',
  '/club/sponsors',
  '/teams/men-first-team/all',
  '/teams/women-first-team/all',
  '/teams/u21-mens-team/all',
  '/teams/u21-womens-team/all',
  '/teams/youth-teams',
].map((path) => ({ path }))

const priorityFor = (path: string): number => {
  if (path === '/') return 1
  if (['/news', '/tv', '/fixtures', '/academy', '/contact', '/shop', '/memberships'].includes(path)) return 0.9
  if (path.startsWith('/news/') || path.startsWith('/tv/')) return 0.7
  if (path.startsWith('/fixtures/') || path.startsWith('/players/')) return 0.6
  return 0.5
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const general = await getGeneralGlobal().catch(() => null)
  const shopIsPublic = general?.shopVisibility === 'public'

  const groups = await Promise.all([
    listPages(),
    listNewsCategories(),
    listNewsEntries(),
    listGalleries(),
    listVideos(),
    listFixtures(),
    listPlayers(),
    shopIsPublic ? listProducts() : Promise.resolve([]),
  ])

  // Later entries win, so a CMS page's lastModified replaces the bare static route.
  const byPath = new Map<string, ContentEntry>()
  for (const entry of [
    ...STATIC_ROUTES,
    ...(shopIsPublic ? [{ path: '/shop' }, { path: '/memberships' }] : []),
    { path: '/membership/benefits' },
    ...groups.flat(),
  ]) {
    byPath.set(entry.path, { ...byPath.get(entry.path), ...entry })
  }

  return [...byPath.values()].map(({ path, lastModified }) => ({
    url: absoluteUrl(path),
    lastModified: lastModified ? new Date(lastModified) : undefined,
    priority: priorityFor(path),
  }))
}
