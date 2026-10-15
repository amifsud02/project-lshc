import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import '@/components/TV/tv.css'
import VideoCard from '@/components/TV/VideoCard'
import { relativeDate } from '@/components/TV/relativeDate'
import { getVideoBySlug, getVideos } from '@/lib/data/videos'
import { uploadedVideoUrl, videoImage, videoThumbnail } from '@/lib/data/videoThumbnail'
import { videoCategoryLabel } from '@/lib/data/videoCategories'

export const revalidate = 60

// Nothing is pre-built; each page renders on its first visit and is then cached (see `revalidate`).
export function generateStaticParams() {
  return []
}

type Params = { slug: string }

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params
  const video = await getVideoBySlug(slug)
  if (!video) return {}
  const description = video.description ?? `${videoCategoryLabel(video.category)} on La Salle TV.`
  const image = await videoImage(video)
  return {
    title: `${video.title} | La Salle TV`,
    description,
    alternates: { canonical: `${process.env.NEXT_PUBLIC_API_URL}/tv/${video.slug}` },
    openGraph: { title: video.title, description, images: image ? [image] : [], type: 'video.other' },
  }
}

export default async function VideoPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const video = await getVideoBySlug(slug)
  if (!video) notFound()

  const related = await getVideos({ category: video.category, excludeId: video.id, limit: 4 })
  const team = typeof video.team === 'object' ? video.team : null
  const fileUrl = uploadedVideoUrl(video)

  return (
    <div className="tv">
      <section className="tv-player">
        <div className="tv-wrap">
          <div className="tv-player__frame">
            {fileUrl ? (
              <video src={fileUrl} poster={videoThumbnail(video) ?? undefined} controls playsInline preload="metadata" />
            ) : (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?rel=0`}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        </div>
      </section>

      <section className="tv-wrap tv-section">
        <Link href="/tv" className="link">← All videos</Link>
        <p className="tv-meta" style={{ marginTop: 16 }}>
          <Link href={`/tv?category=${video.category}`}>{videoCategoryLabel(video.category)}</Link>
          {team ? (<><span aria-hidden="true">·</span><span>{team.teamName}</span></>) : null}
          <span aria-hidden="true">·</span>
          <time dateTime={video.publishedAt}>{relativeDate(video.publishedAt)}</time>
        </p>
        <h1 className="tv-detail__title">{video.title}</h1>
        {video.description ? <p className="lead">{video.description}</p> : null}
      </section>

      {related.length ? (
        <section className="tv-wrap tv-section">
          <div className="tv-section__head">
            <h2 className="tv-section__title">More {videoCategoryLabel(video.category).toLowerCase()}</h2>
          </div>
          <div className="tv-grid">
            {related.map((v) => <VideoCard key={v.id} video={v} />)}
          </div>
        </section>
      ) : null}
    </div>
  )
}
