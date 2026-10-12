'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import styles from './UpcomingMatches.module.css'
import type { NormalizedFixture } from '@/lib/utils/normalize/sports'
import {
  FIXTURE_CATEGORIES,
  FIXTURE_CATEGORY_LABELS,
  type FixtureCategory,
} from '@/lib/fixtures/categories'
import { venueName } from '@/lib/fixtures/venues'

const DISPLAY_TZ = 'Europe/Malta'

const part = (iso: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: DISPLAY_TZ, ...options }).format(new Date(iso))

const formatMatchDate = (iso: string) => {
  const time = part(iso, { hour: '2-digit', minute: '2-digit', hour12: false })
  return {
    full: part(iso, { day: 'numeric', month: 'short', year: 'numeric' }),
    day: part(iso, { day: 'numeric' }),
    month: part(iso, { month: 'short' }).replace('.', ''),
    // The MHA sync stores a missing throw-off time as midnight.
    time: time === '00:00' ? 'Time TBC' : time,
  }
}

/** Our own teams are shown brighter than the opponent. */
const isClubTeam = (name: string) => /la\s*salle/i.test(name)

type Props = {
  title?: string
  fixtures: NormalizedFixture[]
  /** Cards per tab (or in total without tabs). */
  limit: number
  showCategoryFilter: boolean
}

export default function UpcomingMatches({ title, fixtures, limit, showCategoryFilter }: Props) {
  const categories = useMemo(
    () => FIXTURE_CATEGORIES.filter((c) => fixtures.some((f) => f.category === c)),
    [fixtures],
  )
  const showTabs = showCategoryFilter && categories.length > 1
  const [selected, setSelected] = useState<FixtureCategory | undefined>(categories[0])

  const visible = useMemo(() => {
    const list = showTabs ? fixtures.filter((f) => f.category === selected) : fixtures
    return list.slice(0, limit)
  }, [fixtures, limit, selected, showTabs])

  const trackRef = useRef<HTMLUListElement>(null)
  const [canScroll, setCanScroll] = useState({ back: false, forward: false })

  const updateScroll = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    setCanScroll({
      back: el.scrollLeft > 4,
      forward: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    })
  }, [])

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    el.scrollTo({ left: 0 })
    updateScroll()
    const observer = new ResizeObserver(updateScroll)
    observer.observe(el)
    return () => observer.disconnect()
  }, [visible, updateScroll])

  const scrollByCard = (direction: 1 | -1) => {
    const el = trackRef.current
    const card = el?.querySelector('li')
    if (!el || !card) return
    el.scrollBy({ left: direction * card.getBoundingClientRect().width, behavior: 'smooth' })
  }

  return (
    <section className={styles.section}>
      <div className="parent">
        <div className={styles.header}>
          <div className={styles.headings}>
            {title ? <h2 className={styles.title}>{title}</h2> : null}
            {showTabs ? (
              <div className={styles.tabs} role="tablist" aria-label="Team">
                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="tab"
                    aria-selected={c === selected}
                    className={`${styles.tab} ${c === selected ? styles.tabActive : ''}`}
                    onClick={() => setSelected(c)}
                  >
                    {FIXTURE_CATEGORY_LABELS[c]}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {canScroll.back || canScroll.forward ? (
            <div className={styles.arrows}>
              <button
                type="button"
                className={styles.arrow}
                onClick={() => scrollByCard(-1)}
                disabled={!canScroll.back}
                aria-label="Previous matches"
              >
                <ChevronLeft />
              </button>
              <button
                type="button"
                className={styles.arrow}
                onClick={() => scrollByCard(1)}
                disabled={!canScroll.forward}
                aria-label="Next matches"
              >
                <ChevronRight />
              </button>
            </div>
          ) : null}
        </div>

        {visible.length === 0 ? (
          <p className={styles.empty}>No upcoming matches scheduled yet.</p>
        ) : (
          <ul ref={trackRef} className={styles.track} onScroll={updateScroll}>
            {visible.map((fixture, i) => {
              const date = formatMatchDate(fixture.startDate)
              const venue = venueName(fixture.venue)
              return (
                <li key={fixture.id} className={`${styles.card} ${i === 0 ? styles.cardNext : ''}`}>
                  <div className={styles.meta}>
                    <p className={styles.competition}>{fixture.competition?.name ?? 'Match'}</p>
                    <p className={styles.metaStrong}>{date.full}</p>
                    <p className={styles.metaSoft}>{date.time}</p>
                    {venue ? <p className={styles.metaSoft}>{venue}</p> : null}
                  </div>

                  <div className={styles.bottom}>
                    <p className={`${styles.bigDate} numbers`} aria-hidden>
                      {date.day} {date.month}
                    </p>
                    <div className={styles.teams}>
                      {[fixture.homeTeam, fixture.awayTeam].map((team, t) => (
                        <p
                          key={t}
                          className={`${styles.team} ${isClubTeam(team.name) ? styles.teamClub : ''}`}
                        >
                          {team.name}
                        </p>
                      ))}
                    </div>
                    <Link
                      href={`/fixtures/${fixture.slug}`}
                      className={styles.cta}
                      aria-label={`Match centre: ${fixture.homeTeam.name} v ${fixture.awayTeam.name}, ${date.full}`}
                    >
                      Match centre
                    </Link>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
