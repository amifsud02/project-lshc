import React from 'react'

import {
  teamInitials,
  type NormalizedLineupRow,
  type NormalizedTeam,
} from '@/lib/utils/normalize/sports'
import styles from './Lineup.module.css'

const Discipline = ({ row }: { row: NormalizedLineupRow }) => (
  <span className={styles.discipline}>
    {row.yellowCard ? (
      <span className={`${styles.card} ${styles.yellow}`} title={`Yellow card ${row.yellowCard}`} />
    ) : null}
    {row.suspensions.map((time, i) => (
      <span key={i} className={styles.suspension} title={`2-minute suspension ${time}`}>
        2&apos;
      </span>
    ))}
    {row.redCard ? (
      <span className={`${styles.card} ${styles.red}`} title={`Red card ${row.redCard}`} />
    ) : null}
  </span>
)

const TeamSheet = ({ team, rows }: { team: NormalizedTeam; rows: NormalizedLineupRow[] }) => (
  <div className={styles.team}>
    <div className={styles.teamHeader}>
      {team.logoUrl ? (
        <img src={team.logoUrl} alt="" className={styles.logo} />
      ) : (
        <span className={styles.logoPlaceholder} aria-hidden>
          {teamInitials(team.name)}
        </span>
      )}
      <h3>{team.name}</h3>
    </div>

    {rows.length ? (
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.num}>#</th>
            <th>Player</th>
            <th className={styles.stat} title="Goals (penalties scored / taken)">
              Goals
            </th>
            <th className={styles.stat}>Cards</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className={`${styles.num} numbers`}>{row.number ?? '–'}</td>
              <td className={styles.name}>
                {row.name}
                {row.mvp ? <span className={styles.mvp}>MVP</span> : null}
              </td>
              <td className={`${styles.stat} numbers`}>
                {row.goals}
                {row.penaltyAttempts ? (
                  <span className={styles.penalties}>
                    {' '}
                    ({row.penaltyGoals}/{row.penaltyAttempts})
                  </span>
                ) : null}
              </td>
              <td className={styles.stat}>
                <Discipline row={row} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ) : (
      <p className={styles.empty}>Line up not available</p>
    )}
  </div>
)

type Props = {
  homeTeam: NormalizedTeam
  awayTeam: NormalizedTeam
  homeLineup: NormalizedLineupRow[]
  awayLineup: NormalizedLineupRow[]
}

export default function Lineup({ homeTeam, awayTeam, homeLineup, awayLineup }: Props) {
  if (!homeLineup.length && !awayLineup.length) {
    return <p className={styles.empty}>Line Up Not Available</p>
  }

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>Line Ups</h2>
      <div className={styles.grid}>
        <TeamSheet team={homeTeam} rows={homeLineup} />
        <TeamSheet team={awayTeam} rows={awayLineup} />
      </div>
    </div>
  )
}
