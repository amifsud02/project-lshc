import { getPayload, type Where } from 'payload'
import config from '@payload-config'
import type { Gallery, GalleryCategory, Media } from '@/payload-types'
import { cachedFind } from '@/lib/utils/payload/cached'

type ListQuery = {
  tag?: string
  limit?: number
}

export async function getGalleryCategories(): Promise<GalleryCategory[]> {
  const payload = await getPayload({ config })
  const { docs } = await cachedFind({
    collection: 'gallery-categories',
    depth: 0,
    limit: 100,
    sort: 'title',
  })
  return docs as GalleryCategory[]
}

export async function getGalleryCategoryBySlug(slug: string): Promise<GalleryCategory | null> {
  const payload = await getPayload({ config })
  const { docs } = await cachedFind({
    collection: 'gallery-categories',
    where: { slug: { equals: slug } },
    depth: 0,
    limit: 1,
  })
  return (docs[0] as GalleryCategory) ?? null
}

export async function getGalleries(q: ListQuery = {}): Promise<Gallery[]> {
  const payload = await getPayload({ config })
  const where: Where = {}

  if (q.tag) {
    const cat = await getGalleryCategoryBySlug(q.tag)
    if (!cat) return []
    where.tag = { equals: cat.id }
  }

  const { docs } = await cachedFind({
    collection: 'galleries',
    where,
    depth: 1,
    limit: q.limit ?? 50,
    sort: '-publishedAt',
  })
  return docs as Gallery[]
}

export async function getGalleryBySlug(slug: string): Promise<Gallery | null> {
  const payload = await getPayload({ config })
  const { docs } = await cachedFind({
    collection: 'galleries',
    where: { slug: { equals: slug } },
    depth: 1,
    limit: 1,
  })
  return (docs[0] as Gallery) ?? null
}

export async function getGalleryImages(folder: Gallery['folder']): Promise<Media[]> {
  const folderId = typeof folder === 'object' && folder !== null ? folder.id : folder
  if (!folderId) return []

  const payload = await getPayload({ config })
  const { docs } = await cachedFind({
    collection: 'media',
    where: { folder: { equals: folderId } },
    depth: 0,
    limit: 500,
    sort: '-createdAt',
  })
  return docs as Media[]
}
