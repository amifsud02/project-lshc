import Image from 'next/image'
import Link from 'next/link'

import type { Player } from '@/payload-types'
import type { PlayerMatch } from '@/lib/players/data'
import { describePlayer, playerName, playerTeams, positionLabel, seasonLabel } from '@/lib/players/profile'
import { mediaUrl } from '@/lib/seo/meta'
import { paths } from '@/lib/seo/site'
import { teamInitials } from '@/lib/utils/normalize/sports'
import styles from './PlayerProfile.module.css'

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Malta', day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(iso),
  )

const STAT_LABELS: [keyof NonNullable<Player['seasonStats']>, string][] = [
  ['appearances', 'Appearances'],
  ['goals', 'Goals'],
  ['penaltyGoals', '7m goals'],
  ['mvp', 'MVP awards'],
  ['yellowCards', 'Yellow cards'],
  ['suspensions', '2-minute suspensions'],
  ['redCards', 'Red cards'],
  ['blueCards', 'Blue cards'],
]

// Short headings so the season table fits a phone without much sideways scrolling.
const HISTORY_COLUMNS: [keyof NonNullable<Player['careerStats']>, string][] = [
  ['appearances', 'Apps'],
  ['goals', 'Goals'],
  ['penaltyGoals', '7m'],
  ['mvp', 'MVP'],
  ['yellowCards', 'Yellow'],
  ['suspensions', '2 min'],
  ['redCards', 'Red'],
  ['blueCards', 'Blue'],
]

export default function PlayerProfile({ player, matches }: { player: Player; matches: PlayerMatch[] }) {
  const name = playerName(player)
  const role = positionLabel(player.position)
  const teams = playerTeams(player)
  const photo = mediaUrl(player.profilePicture)
  const stats = player.seasonStats
  const season = seasonLabel(stats?.season)
  // Blue cards are rare, so the tile only appears for a player who has one.
  const statTiles = STAT_LABELS.filter(([key]) => typeof stats?.[key] === 'number' && (key !== 'blueCards' || Number(stats[key]) > 0))

  // Season by season, newest first, then the career total. Only worth a table once
  // there is more to it than the current season the tiles already show.
  const seasonRows = [
    ...(stats?.appearances ? [{ ...stats, id: 'current', season: season ?? 'This season' }] : []),
    ...(player.pastSeasons ?? [])
      .filter((r) => r.appearances)
      .map((r) => ({ ...r, id: r.id ?? r.seasonId ?? r.season, season: seasonLabel(r.season) ?? '' })),
  ]
  const career = player.careerStats
  const showHistory =
    !!career?.appearances && (seasonRows.length > 1 || career.appearances > (stats?.appearances ?? 0))
  const historyColumns = HISTORY_COLUMNS.filter(
    ([key]) => key !== 'blueCards' || Number(career?.blueCards) > 0,
  )

  return (
    <div className={`parent ${styles.profile}`}>
      <section className={styles.intro}>
        <div className={styles.photo}>
          {photo ? (
            <Image src={photo} alt={name} fill sizes="220px" />
          ) : (
            <span className={styles.monogram} aria-hidden>
              {teamInitials(name)}
            </span>
          )}
        </div>

        <div>
          <p className={styles.lead}>{describePlayer(player).lead}</p>
          <dl className={styles.facts}>
            {role ? (
              <div className={styles.fact}>
                <dt>Position</dt>
                <dd>{role}</dd>
              </div>
            ) : null}
            {typeof player.number === 'number' && player.position !== 'Coach' ? (
              <div className={styles.fact}>
                <dt>Shirt number</dt>
                <dd className="numbers">{player.number}</dd>
              </div>
            ) : null}
            {teams.length ? (
              <div className={styles.fact}>
                <dt>{teams.length > 1 ? 'Squads' : 'Squad'}</dt>
                <dd>{teams.join(' · ')}</dd>
              </div>
            ) : null}
            <div className={styles.fact}>
              <dt>Club</dt>
              <dd>La Salle Handball Club</dd>
            </div>
          </dl>
        </div>
      </section>

      {statTiles.length && stats?.appearances ? (
        <section aria-labelledby="season-stats">
          <h2 id="season-stats" className={styles.sectionTitle}>
            {season ? `${season} season` : 'This season'}
          </h2>
          <dl className={styles.stats}>
            {statTiles.map(([key, label]) => (
              <div key={key} className={styles.stat}>
                <dd className="numbers">{stats[key] as number}</dd>
                <dt>{label}</dt>
              </div>
            ))}
          </dl>
          <p className={styles.note}>
            Totals across every Malta Handball Association competition this season
            {teams.length > 1 ? ', for all of their squads' : ''}.
          </p>
        </section>
      ) : null}

      {showHistory && career ? (
        <section aria-labelledby="career-stats">
          <h2 id="career-stats" className={styles.sectionTitle}>
            Season by season
          </h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Season</th>
                  {historyColumns.map(([key, label]) => (
                    <th key={key} className={styles.num}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {seasonRows.map((row) => (
                  <tr key={row.id}>
                    <td className="numbers">{row.season}</td>
                    {historyColumns.map(([key]) => (
                      <td key={key} className={`${styles.num} numbers`}>
                        {row[key] ?? 0}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className={styles.totalRow}>
                  <td>Career</td>
                  {historyColumns.map(([key]) => (
                    <td key={key} className={`${styles.num} numbers`}>
                      {career[key] ?? 0}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <p className={styles.note}>Career totals cover every season on record with the Malta Handball Association.</p>
        </section>
      ) : null}

      {matches.length ? (
        <section aria-labelledby="recent-matches">
          <h2 id="recent-matches" className={styles.sectionTitle}>
            Recent matches
          </h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Match</th>
                  <th className={styles.num}>Score</th>
                  <th className={styles.num}>Goals</th>
                </tr>
              </thead>
              <tbody>
                {matches.map(({ fixture, goals, mvp }) => (
                  <tr key={fixture.id}>
                    <td className="numbers">{formatDate(fixture.startDate)}</td>
                    <td>
                      <Link href={paths.fixture(fixture.slug)}>
                        {fixture.homeTeam.name} vs {fixture.awayTeam.name}
                      </Link>
                      {fixture.competition?.name ? <span className={styles.muted}>{fixture.competition.name}</span> : null}
                    </td>
                    <td className={`${styles.num} numbers`}>
                      {fixture.homeScore}–{fixture.awayScore}
                    </td>
                    <td className={`${styles.num} numbers`}>
                      {goals}
                      {mvp ? <span className={styles.muted}>MVP</span> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={styles.note}>
            <Link href={paths.fixtures} className={styles.more}>
              All La Salle fixtures and results
            </Link>
          </p>
        </section>
      ) : null}
    </div>
  )
}
