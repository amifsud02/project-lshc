import Link from 'next/link'
import { cachedFind } from '@/lib/utils/payload/cached'
import { fixtureFromPayload } from '@/lib/utils/normalize/sports'
import { venueName } from '@/lib/fixtures/venues'
import { paths } from '@/lib/seo/site'
import './blocks.css'

type Props = { heading?: string | null; team?: { id: string } | string | null }

const malta = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-MT', { timeZone: 'Europe/Malta', ...opts }).format(new Date(iso))

/** The next scheduled match from the fixtures list, optionally for one team. */
export default async function NextMatch({ heading, team }: Props) {
  const teamId = team && typeof team === 'object' ? team.id : team
  // Rounded to the hour so the cached query is shared between requests.
  const now = new Date()
  now.setMinutes(0, 0, 0)
  const { docs } = await cachedFind({
    collection: 'fixtures',
    where: {
      and: [
        { startDate: { greater_than_equal: now.toISOString() } },
        { status: { equals: 'Scheduled' } },
        ...(teamId ? [{ or: [{ homeTeam: { equals: teamId } }, { awayTeam: { equals: teamId } }] }] : []),
      ],
    },
    sort: 'startDate',
    depth: 1,
    limit: 1,
  })
  if (!docs[0]) return null
  const f = fixtureFromPayload(docs[0])
  const venue = venueName(f.venue)

  return (
    <section className="parent block-next">
      <h2 className="section-title">{heading || 'Next match'}</h2>
      <div className="block-next__card card card--raised">
        <div className="block-next__teams">
          <span className="block-next__team">{f.homeTeam.name}</span>
          <span className="block-next__vs" aria-hidden="true">
            vs
          </span>
          <span className="block-next__team">{f.awayTeam.name}</span>
        </div>
        <dl className="block-next__meta">
          <div>
            <dt>When</dt>
            <dd>
              <time dateTime={f.startDate}>
                {malta(f.startDate, { weekday: 'long', day: 'numeric', month: 'long' })} at{' '}
                {malta(f.startDate, { hour: '2-digit', minute: '2-digit', hour12: false })}
              </time>
            </dd>
          </div>
          {venue ? (
            <div>
              <dt>Where</dt>
              <dd>{venue}</dd>
            </div>
          ) : null}
          {f.competition ? (
            <div>
              <dt>Competition</dt>
              <dd>{f.competition.name}</dd>
            </div>
          ) : null}
        </dl>
        <div className="block-next__links">
          <Link href={paths.fixture(f.slug)} className="btn btn--sm">
            Match details
          </Link>
          <Link href={paths.fixtures} className="btn-text">
            All fixtures
          </Link>
        </div>
      </div>
    </section>
  )
}
