import Link from 'next/link'
import Image from 'next/image'
import type { Video } from '@/payload-types'
import { videoImage } from '@/lib/data/videoThumbnail'
import { videoCategoryLabel } from '@/lib/data/videoCategories'
import { relativeDate } from './relativeDate'

type Props = {
  video: Video
  size?: 'default' | 'large'
}

export default async function VideoCard({ video, size = 'default' }: Props) {
  const imageSrc = await videoImage(video)
  return (
    <Link href={`/tv/${video.slug}`} className={`tv-card${size === 'large' ? ' tv-card--large' : ''}`}>
      <div className="tv-card__media">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt=""
            fill
            sizes={size === 'large' ? '(min-width: 1024px) 60vw, 100vw' : '(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw'}
          />
        ) : null}
        <span className="tv-play" aria-hidden="true" />
        {video.duration ? <span className="tv-card__duration">{video.duration}</span> : null}
      </div>
      <div className="tv-card__body">
        <p className="tv-meta">
          <span>{videoCategoryLabel(video.category)}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={video.publishedAt}>{relativeDate(video.publishedAt)}</time>
        </p>
        <h3 className="tv-card__title">{video.title}</h3>
      </div>
    </Link>
  )
}
