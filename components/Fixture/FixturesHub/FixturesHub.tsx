import Link from 'next/link'

import Fixtures from '@/components/Fixture/Fixture'
import { FIXTURE_CATEGORIES, FIXTURE_CATEGORY_LABELS, type FixtureCategory } from '@/lib/fixtures/categories'
import { paths } from '@/lib/seo/site'
import type { NormalizedFixture } from '@/lib/utils/normalize/sports'
import styles from './FixturesHub.module.css'

const monthOf = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Malta', month: 'long', year: 'numeric' }).format(new Date(iso))

/** Consecutive fixtures that fall in the same month, in the order given. */
const byMonth = (fixtures: NormalizedFixture[]) =>
  fixtures.reduce<{ month: string; fixtures: NormalizedFixture[] }[]>((groups, fixture) => {
    const month = monthOf(fixture.startDate)
    const last = groups.at(-1)
    if (last?.month === month) last.fixtures.push(fixture)
    else groups.push({ month, fixtures: [fixture] })
    return groups
  }, [])

const MonthList = ({ fixtures, empty }: { fixtures: NormalizedFixture[]; empty: string }) =>
  fixtures.length ? (
    byMonth(fixtures).map((group) => (
      <div key={group.month}>
        <h3 className={styles.month}>{group.month}</h3>
        <Fixtures showTitle={false} data={group.fixtures} />
      </div>
    ))
  ) : (
    <p className={styles.empty}>{empty}</p>
  )

type Props = {
  season: string
  upcoming: NormalizedFixture[]
  results: NormalizedFixture[]
  /** The team filter in use; every team when unset. */
  category?: FixtureCategory
}

/**
 * Every La Salle fixture and result this season, rendered on the server so each match
 * is a plain link in the HTML. The team filter is a set of links, not tabs.
 */
export default function FixturesHub({ season, upcoming, results, category }: Props) {
  const categories = FIXTURE_CATEGORIES.filter((c) => [...upcoming, ...results].some((f) => f.category === c))
  const inCategory = (f: NormalizedFixture) => !category || f.category === category
  const team = category ? `: ${FIXTURE_CATEGORY_LABELS[category]}` : ''

  return (
    <div className={`parent ${styles.hub}`}>
      <p className={styles.intro}>
        Every La Salle Handball Club match in the {season} season, from the men&apos;s and women&apos;s first teams to the
        U19 and youth sides. Dates, venues and scores come from the Malta Handball Association and update after every
        match. Open a match for its line-ups, scorers, preview and report.
      </p>

      {categories.length > 1 ? (
        <nav aria-label="Filter by team">
          <ul className={styles.filter}>
            <li>
              <Link href={paths.fixtures} aria-current={category ? undefined : 'page'}>
                All teams
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c}>
                <Link href={`${paths.fixtures}?category=${c}`} aria-current={c === category ? 'page' : undefined}>
                  {FIXTURE_CATEGORY_LABELS[c]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      <section className={styles.section} aria-labelledby="upcoming">
        <h2 id="upcoming" className={styles.title}>
          Upcoming matches{team}
        </h2>
        <MonthList fixtures={upcoming.filter(inCategory)} empty="No upcoming matches scheduled yet." />
      </section>

      <section className={styles.section} aria-labelledby="results">
        <h2 id="results" className={styles.title}>
          Results {season}
          {team}
        </h2>
        <MonthList fixtures={results.filter(inCategory)} empty="No results yet this season." />
      </section>
    </div>
  )
}
