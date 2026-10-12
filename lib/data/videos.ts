import type { Where } from 'payload'
import type { Team, Video } from '@/payload-types'
import { cachedFind } from '@/lib/utils/payload/cached'
import type { VideoCategory } from './videoCategories'

type ListQuery = {
  category?: VideoCategory
  season?: string
  teamId?: string
  excludeId?: string
  limit?: number
}

const published: Where = { _status: { equals: 'published' } }

export async function getVideos(q: ListQuery = {}): Promise<Video[]> {
  const and: Where[] = [published]
  if (q.category) and.push({ category: { equals: q.category } })
  if (q.season) and.push({ season: { equals: q.season } })
  if (q.teamId) and.push({ team: { equals: q.teamId } })
  if (q.excludeId) and.push({ id: { not_equals: q.excludeId } })

  const { docs } = await cachedFind({
    collection: 'videos',
    where: { and },
    depth: 1,
    limit: q.limit ?? 24,
    sort: '-publishedAt',
  })
  return docs as Video[]
}

/** The newest featured video, falling back to the newest video. */
export async function getFeaturedVideo(): Promise<Video | null> {
  const { docs } = await cachedFind({
    collection: 'videos',
    where: { and: [published, { featured: { equals: true } }] },
    depth: 1,
    limit: 1,
    sort: '-publishedAt',
  })
  if (docs[0]) return docs[0] as Video
  const [latest] = await getVideos({ limit: 1 })
  return latest ?? null
}

export async function getVideoBySlug(slug: string): Promise<Video | null> {
  const { docs } = await cachedFind({
    collection: 'videos',
    where: { and: [published, { slug: { equals: slug } }] },
    depth: 1,
    limit: 1,
  })
  return (docs[0] as Video) ?? null
}

/** Teams that have at least one published video, in the order they first appear. */
export async function getVideoChannels(): Promise<{ team: Team; videos: Video[] }[]> {
  const recent = await getVideos({ limit: 200 })
  const channels = new Map<string, { team: Team; videos: Video[] }>()
  for (const video of recent) {
    const team = typeof video.team === 'object' ? video.team : null
    if (!team) continue
    const channel = channels.get(team.id) ?? { team, videos: [] }
    if (channel.videos.length < 8) channel.videos.push(video)
    channels.set(team.id, channel)
  }
  return [...channels.values()]
}

/** Distinct seasons, newest first. */
export async function getVideoSeasons(): Promise<string[]> {
  const { docs } = await cachedFind({
    collection: 'videos',
    where: { and: [published, { season: { exists: true } }] },
    depth: 0,
    limit: 1000,
    select: { season: true },
    pagination: false,
  })
  const seasons = new Set(docs.map((d) => d.season).filter((s): s is string => !!s))
  return [...seasons].sort().reverse()
}
