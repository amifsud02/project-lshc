import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import '@/components/TV/tv.css'
import VideoCard from '@/components/TV/VideoCard'
import { relativeDate } from '@/components/TV/relativeDate'
import { getVideoBySlug, getVideos } from '@/lib/data/videos'
import { uploadedVideoUrl, videoImage, videoThumbnail } from '@/lib/data/videoThumbnail'
import { videoCategoryLabel } from '@/lib/data/videoCategories'
import TrackedVideo from '@/components/Analytics/TrackedVideo'
import JsonLd from '@/components/Seo/JsonLd'
import { seoDescription, seoImage, seoTitle, seoTitleText } from '@/lib/seo/meta'
import { paths } from '@/lib/seo/site'
import { breadcrumbJsonLd, isoDuration, videoJsonLd } from '@/lib/seo/structuredData'

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
  const description = seoDescription(video.meta, video.description) ?? `${videoCategoryLabel(video.category)} on La Salle TV.`
  const image = seoImage(video.meta) ?? (await videoImage(video))
  const fallbackTitle = `${video.title} | La Salle TV`
  return {
    title: seoTitle(video.meta, fallbackTitle),
    description,
    alternates: { canonical: paths.video(video.slug) },
    openGraph: {
      title: seoTitleText(video.meta, video.title),
      description,
      url: paths.video(video.slug),
      images: image ? [image] : [],
      type: 'video.other',
    },
  }
}

export default async function VideoPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const video = await getVideoBySlug(slug)
  if (!video) notFound()

  const related = await getVideos({ category: video.category, excludeId: video.id, limit: 4 })
  const team = typeof video.team === 'object' ? video.team : null
  const fileUrl = uploadedVideoUrl(video)

  const thumbnail = await videoImage(video)

  return (
    <div className="tv">
      <JsonLd
        data={[
          videoJsonLd({
            path: paths.video(video.slug),
            name: video.title,
            description: video.description || `${videoCategoryLabel(video.category)} on La Salle TV.`,
            thumbnailUrl: thumbnail || undefined,
            uploadDate: video.publishedAt,
            duration: isoDuration(video.duration),
            contentUrl: fileUrl ?? undefined,
            embedUrl: fileUrl ? undefined : `https://www.youtube.com/embed/${video.youtubeId}`,
          }),
          breadcrumbJsonLd([
            ['La Salle TV', '/tv'],
            [video.title, paths.video(video.slug)],
          ]),
        ]}
      />
      <section className="tv-player">
        <div className="tv-wrap">
          <div className="tv-player__frame">
            {fileUrl ? (
              <TrackedVideo title={video.title} src={fileUrl} poster={videoThumbnail(video) ?? undefined} controls playsInline preload="metadata" />
            ) : (
              <iframe
                // enablejsapi lets GA4's enhanced measurement report plays, progress and completions.
                src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?rel=0&enablejsapi=1`}
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
