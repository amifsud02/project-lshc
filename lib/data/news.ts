import { getPayload, type Where } from 'payload'
import config from '@payload-config'
import type { News, NewsCategory } from '@/payload-types'
import { cachedFind } from '@/lib/utils/payload/cached'
import { getGeneralGlobal } from '@/lib/utils/payload/globals'

type ListQuery = {
  category?: string
  tag?: string
  limit?: number
}

export async function getNewsCategories(): Promise<NewsCategory[]> {
  const payload = await getPayload({ config })
  const { docs } = await cachedFind({
    collection: 'news-categories',
    depth: 0,
    limit: 100,
    sort: 'title',
  })
  return docs as NewsCategory[]
}

export async function getNewsCategoryBySlug(slug: string): Promise<NewsCategory | null> {
  const payload = await getPayload({ config })
  const { docs } = await cachedFind({
    collection: 'news-categories',
    where: { slug: { equals: slug } },
    depth: 0,
    limit: 1,
  })
  return (docs[0] as NewsCategory) ?? null
}

export async function getNewsPosts(q: ListQuery = {}): Promise<News[]> {
  const payload = await getPayload({ config })
  const where: Where = {}

  if (q.category) {
    const cat = await getNewsCategoryBySlug(q.category)
    if (!cat) return []
    where.category = { equals: cat.id }
  }
  if (q.tag) where.tags = { in: [q.tag] }

  const { docs } = await cachedFind({
    collection: 'news',
    where,
    depth: 1,
    limit: q.limit ?? 50,
    sort: '-publishedAt',
  })
  return docs as News[]
}

export type NewsPage = { posts: News[]; page: number; totalPages: number }

/** One page of a news listing, sized by "posts per page" in Site Settings. */
export async function getNewsPage(q: { category?: string; tag?: string; page?: number }): Promise<NewsPage> {
  const where: Where = {}
  if (q.category) {
    const cat = await getNewsCategoryBySlug(q.category)
    if (!cat) return { posts: [], page: 1, totalPages: 1 }
    where.category = { equals: cat.id }
  }
  if (q.tag) where.tags = { in: [q.tag] }

  const { postsPerPage } = await getGeneralGlobal()
  const result = await cachedFind({
    collection: 'news',
    where,
    depth: 1,
    limit: postsPerPage,
    page: Math.max(1, q.page ?? 1),
    sort: '-publishedAt',
  })
  return {
    posts: result.docs as News[],
    page: result.page ?? 1,
    totalPages: Math.max(1, result.totalPages),
  }
}

export async function getNewsBySlug(slug: string): Promise<News | null> {
  const payload = await getPayload({ config })
  const { docs } = await cachedFind({
    collection: 'news',
    where: { slug: { equals: slug } },
    depth: 1,
    limit: 1,
  })
  return (docs[0] as News) ?? null
}

function getCategoryId(category: News['category']): string | null {
  if (!category) return null
  if (typeof category === 'object') return category.id
  return category
}

export async function getAdjacentNewsPosts(
  current: News,
): Promise<{ previous: News | null; next: News | null }> {
  const categoryId = getCategoryId(current.category)
  if (!categoryId) return { previous: null, next: null }

  const payload = await getPayload({ config })
  const [prevResult, nextResult] = await Promise.all([
    cachedFind({
      collection: 'news',
      where: {
        category: { equals: categoryId },
        publishedAt: { less_than: current.publishedAt },
      },
      depth: 1,
      limit: 1,
      sort: '-publishedAt',
    }),
    cachedFind({
      collection: 'news',
      where: {
        category: { equals: categoryId },
        publishedAt: { greater_than: current.publishedAt },
      },
      depth: 1,
      limit: 1,
      sort: 'publishedAt',
    }),
  ])

  return {
    previous: (prevResult.docs[0] as News) ?? null,
    next: (nextResult.docs[0] as News) ?? null,
  }
}

export async function getAllNewsTags(): Promise<string[]> {
  const docs = await getNewsPosts({ limit: 500 })
  const set = new Set<string>()
  for (const d of docs) {
    for (const t of d.tags ?? []) if (t) set.add(t)
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b))
}
