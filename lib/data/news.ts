import { getPayload, type Where } from 'payload'
import config from '@payload-config'
import type { News, NewsCategory } from '@/payload-types'

type ListQuery = {
  category?: string
  tag?: string
  limit?: number
}

export async function getNewsCategories(): Promise<NewsCategory[]> {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'news-categories',
    depth: 0,
    limit: 100,
    sort: 'title',
  })
  return docs as NewsCategory[]
}

export async function getNewsCategoryBySlug(slug: string): Promise<NewsCategory | null> {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
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

  const { docs } = await payload.find({
    collection: 'news',
    where,
    depth: 1,
    limit: q.limit ?? 50,
    sort: '-publishedAt',
  })
  return docs as News[]
}

export async function getNewsBySlug(slug: string): Promise<News | null> {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
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
    payload.find({
      collection: 'news',
      where: {
        category: { equals: categoryId },
        publishedAt: { less_than: current.publishedAt },
      },
      depth: 1,
      limit: 1,
      sort: '-publishedAt',
    }),
    payload.find({
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
