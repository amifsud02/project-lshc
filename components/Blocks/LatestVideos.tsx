import Image from 'next/image'
import Link from 'next/link'
import { getVideos } from '@/lib/data/videos'
import { videoImage } from '@/lib/data/videoThumbnail'
import { paths } from '@/lib/seo/site'
import './blocks.css'

type Props = { heading?: string | null; limit?: number | null }

/** The newest La Salle TV videos, linking to their pages. */
export default async function LatestVideos({ heading, limit }: Props) {
  const videos = await getVideos({ limit: Math.min(6, Math.max(1, limit ?? 3)) })
  if (!videos.length) return null
  const cards = await Promise.all(videos.map(async (v) => ({ v, image: await videoImage(v) })))
  return (
    <section className="parent block-videos">
      <div className="block-videos__head">
        <h2 className="section-title">{heading || 'Latest on La Salle TV'}</h2>
        <Link href="/tv" className="btn-text">
          All videos
        </Link>
      </div>
      <ul className="block-videos__grid">
        {cards.map(({ v, image }) => (
          <li key={v.id}>
            <Link href={paths.video(v.slug)} className="block-videos__card">
              <span className="block-videos__thumb">
                <Image src={image} alt="" fill sizes="(min-width: 900px) 30vw, 100vw" className="block-videos__img" />
              </span>
              <span className="block-videos__title">{v.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
