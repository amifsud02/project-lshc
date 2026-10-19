import Link from 'next/link'
import Image from 'next/image'
import '@/components/TV/tv.css'
import { ACCOUNTS_ENABLED } from '@/lib/features'
import VideoCard from '@/components/TV/VideoCard'
import ChannelTabs from '@/components/TV/ChannelTabs'
import { relativeDate } from '@/components/TV/relativeDate'
import {
  getFeaturedVideo,
  getVideoChannels,
  getVideoSeasons,
  getVideos,
} from '@/lib/data/videos'
import { videoImage } from '@/lib/data/videoThumbnail'
import { VIDEO_CATEGORIES, isVideoCategory, videoCategoryLabel } from '@/lib/data/videoCategories'

const title = 'La Salle TV - Highlights, interviews and full matches'
const description =
  'Watch La Salle Handball on demand: match highlights, interviews, full games and behind-the-scenes footage from every team in the club.'
const baseSiteUrl = process.env.NEXT_PUBLIC_API_URL
const canonical = `${baseSiteUrl}/tv`

export const metadata = {
  title,
  description,
  alternates: { canonical },
  openGraph: { title, description, url: canonical },
}

type SP = { category?: string | string[]; season?: string | string[] }

export default async function TVPage({ searchParams }: { searchParams?: Promise<SP> }) {
  const sp = (await searchParams) ?? {}
  const category = isVideoCategory(sp.category) ? sp.category : undefined
  const season = typeof sp.season === 'string' ? sp.season : undefined
  const filtered = Boolean(category || season)

  const [featured, latest, channels, seasons] = await Promise.all([
    getFeaturedVideo(),
    getVideos({ category, season, limit: filtered ? 48 : 10 }),
    filtered ? Promise.resolve([]) : getVideoChannels(),
    getVideoSeasons(),
  ])

  const gridVideos = filtered ? latest : latest.filter((v) => v.id !== featured?.id).slice(0, 9)
  const [lead, ...rest] = gridVideos
  const featuredImage = featured ? await videoImage(featured) : ''

  return (
    <div className="tv">
      {featured ? (
        <section className="tv-hero">
          {featuredImage ? (
            <Image src={featuredImage} alt="" fill priority sizes="100vw" className="tv-hero__image" />
          ) : null}
          <div className="tv-hero__shade" />
          <div className="tv-wrap tv-hero__content">
            <p className="tv-meta tv-meta--light">
              <span>{videoCategoryLabel(featured.category)}</span>
              <span aria-hidden="true">·</span>
              <time dateTime={featured.publishedAt}>{relativeDate(featured.publishedAt)}</time>
            </p>
            <h1 className="tv-hero__title">{featured.title}</h1>
            <Link href={`/tv/${featured.slug}`} className="btn btn--light tv-hero__cta">
              <span className="tv-play tv-play--inline" aria-hidden="true" />
              Watch now
            </Link>
          </div>
        </section>
      ) : (
        <section className="tv-hero tv-hero--empty">
          <div className="tv-wrap tv-hero__content">
            <h1 className="tv-hero__title">La Salle TV</h1>
            <p className="tv-hero__lead">Videos from every La Salle team will appear here soon.</p>
          </div>
        </section>
      )}

      <nav className="tv-wrap tv-chips" aria-label="Video categories">
        <Link href="/tv" className="tv-chip" aria-current={!category ? 'page' : undefined}>
          All videos
        </Link>
        {VIDEO_CATEGORIES.map((c) => (
          <Link
            key={c.value}
            href={`/tv?category=${c.value}`}
            className="tv-chip"
            aria-current={category === c.value ? 'page' : undefined}
          >
            {c.label}
          </Link>
        ))}
      </nav>

      <section className="tv-wrap tv-section">
        <div className="tv-section__head">
          <h2 className="tv-section__title">
            {category ? videoCategoryLabel(category) : 'Latest videos'}
            {season ? ` · ${season}` : null}
          </h2>
          {filtered ? (
            <Link href="/tv" className="link">Clear filters</Link>
          ) : null}
        </div>

        {gridVideos.length === 0 ? (
          <p className="lead">No videos here yet. Check back after the next match.</p>
        ) : filtered ? (
          <div className="tv-grid">
            {gridVideos.map((v) => <VideoCard key={v.id} video={v} />)}
          </div>
        ) : (
          <div className="tv-latest">
            {lead ? <VideoCard video={lead} size="large" /> : null}
            {rest.map((v) => <VideoCard key={v.id} video={v} />)}
          </div>
        )}
      </section>

      {!filtered && ACCOUNTS_ENABLED ? (
        <section className="tv-wrap">
          <div className="tv-cta">
            <div>
              <p className="tv-cta__kicker">Join La Salle</p>
              <h2 className="tv-cta__title">Play, coach or volunteer with the club</h2>
              <p className="tv-cta__text">Registration takes a couple of minutes. We’ll get in touch about training times.</p>
            </div>
            <Link href="/register" className="btn btn--light">Get started</Link>
          </div>
        </section>
      ) : null}

      {channels.length ? (
        <section className="tv-wrap tv-section">
          <div className="tv-section__head">
            <h2 className="tv-section__title">Team channels</h2>
          </div>
          <ChannelTabs
            channels={channels.map(({ team, videos }) => ({
              id: team.id,
              name: team.teamName,
              panel: (
                <div className="tv-rail">
                  {videos.map((v) => <VideoCard key={v.id} video={v} />)}
                </div>
              ),
            }))}
          />
        </section>
      ) : null}

      {seasons.length ? (
        <section className="tv-wrap tv-section">
          <div className="tv-section__head">
            <h2 className="tv-section__title">Season archive</h2>
          </div>
          <ul className="tv-seasons">
            {seasons.map((s) => (
              <li key={s}>
                <Link
                  href={`/tv?season=${encodeURIComponent(s)}`}
                  className="tv-season"
                  aria-current={season === s ? 'page' : undefined}
                >
                  <span className="tv-season__short">{shortSeason(s)}</span>
                  <span className="tv-season__label">Season {s}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

/** "2026/27" → "’26/’27" */
function shortSeason(season: string): string {
  const years = season.match(/\d{2,4}/g)
  if (!years || years.length < 2) return season
  return years.slice(0, 2).map((y) => `’${y.slice(-2)}`).join('/')
}
