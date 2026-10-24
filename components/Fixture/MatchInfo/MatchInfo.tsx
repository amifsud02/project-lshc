import Link from 'next/link'

import NewsCard from '@/components/News/NewsCard/NewsCard'
import type { Fixture, News } from '@/payload-types'
import { venueName } from '@/lib/fixtures/venues'
import { paths } from '@/lib/seo/site'
import type { NormalizedFixture } from '@/lib/utils/normalize/sports'
import styles from './MatchInfo.module.css'

const part = (iso: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Malta', ...options }).format(new Date(iso))

const matchDate = (iso: string) => part(iso, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

/** The MHA sync stores a missing throw-off time as midnight. */
const throwOff = (iso: string) => {
  const time = part(iso, { hour: '2-digit', minute: '2-digit', hour12: false })
  return time === '00:00' ? 'To be confirmed' : time
}

/** Competition, date, throw-off and venue, as text search engines and readers can use. */
export function MatchDetails({ fixture, status }: { fixture: NormalizedFixture; status?: Fixture['status'] }) {
  const venue = fixture.venue && fixture.venue !== 'TBC' ? venueName(fixture.venue) : 'To be confirmed'

  return (
    <section className={styles.section} aria-labelledby="match-details">
      <h2 id="match-details" className={styles.title}>
        Match details
      </h2>
      <dl className={styles.details}>
        {fixture.competition?.name ? (
          <div className={styles.detail}>
            <dt>Competition</dt>
            <dd>{fixture.competition.name}</dd>
          </div>
        ) : null}
        <div className={styles.detail}>
          <dt>Date</dt>
          <dd>{matchDate(fixture.startDate)}</dd>
        </div>
        {fixture.isFinished ? null : (
          <div className={styles.detail}>
            <dt>Throw-off</dt>
            <dd className="numbers">{throwOff(fixture.startDate)}</dd>
          </div>
        )}
        <div className={styles.detail}>
          <dt>Venue</dt>
          <dd>{venue}</dd>
        </div>
        {status === 'Postponed' || status === 'Cancelled' ? (
          <div className={styles.detail}>
            <dt>Status</dt>
            <dd>{status}</dd>
          </div>
        ) : null}
      </dl>
      <Link href={paths.fixtures} className={styles.more}>
        All La Salle fixtures and results
      </Link>
    </section>
  )
}

const categorySlug = (post: News) => (typeof post.category === 'object' ? post.category?.slug : undefined)

export const isMatchReport = (post: News) => Boolean(post.mhaMatchId) || categorySlug(post) === 'match-reports'

const coverageLabel = (post: News): string => {
  if (isMatchReport(post)) return 'Match report'
  if (categorySlug(post) === 'previews') return 'Preview'
  return (typeof post.category === 'object' ? post.category?.title : undefined) ?? 'News'
}

/** The match's preview and report, so the match page and the posts link to each other. */
export function MatchCoverage({ posts }: { posts: News[] }) {
  if (!posts.length) return null

  return (
    <section className={styles.section} aria-labelledby="match-coverage">
      <h2 id="match-coverage" className={styles.title}>
        Preview and report
      </h2>
      <div className={styles.coverage}>
        {posts.map((post) => (
          <div key={post.id}>
            <span className={styles.label}>{coverageLabel(post)}</span>
            <NewsCard data={post} />
          </div>
        ))}
      </div>
    </section>
  )
}

/** On a preview or report: which match it is about, with a link to the match page. */
export function MatchLink({ fixture }: { fixture: NormalizedFixture }) {
  const hasLineups = fixture.homeLineup.length > 0 || fixture.awayLineup.length > 0

  return (
    <p className={styles.matchLink}>
      <Link href={paths.fixture(fixture.slug)}>
        {fixture.homeTeam.name} vs {fixture.awayTeam.name}
        {hasLineups ? ': line-ups and scorers' : ': match page'}
      </Link>
      <span className={styles.matchLinkMeta}>
        {[fixture.competition?.name, matchDate(fixture.startDate)].filter(Boolean).join(' · ')}
      </span>
    </p>
  )
}
