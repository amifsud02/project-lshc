import Image from 'next/image'
import styles from './Standings.module.css'
import type { NormalizedStanding } from '@/lib/utils/normalize/sports'

const CLUB_NAME = 'La Salle'

const Standings = ({
  showTitle,
  data,
}: {
  showTitle: boolean
  data: NormalizedStanding
}) => {
  return (
    <div className={styles.tableContainer}>
      {showTitle && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <h2 className={styles.sectionTitle}>{data.title ?? 'Standings'}</h2>
        </div>
      )}
      <div className={styles.tableWrapper}>
        <section className={styles.table}>
          <div className={`${styles.tableRow} ${styles.tableHeaderRow}`}>
            <div className={styles.tableCell}>Pos</div>
            <div className={styles.tableCell}>Team</div>
            <div className={styles.tableCell}>GP</div>
            <div className={styles.tableCell}>W</div>
            <div className={styles.tableCell}>D</div>
            <div className={styles.tableCell}>L</div>
            <div className={styles.tableCell}>GD</div>
            <div className={styles.tableCell} style={{ marginRight: '3px' }}>
              Pts
            </div>
          </div>

          {data.rows.map((row) => {
            const isClub = row.team.name === CLUB_NAME
            return (
              <div
                className={`${styles.tableRow} ${styles.tableBodyRow} ${
                  isClub ? styles.tablePrimaryRow : ''
                }`}
                key={`${row.position}-${row.team.name}`}
              >
                <div className={`${styles.tableCell} ${styles.tableBodyCell}`}>
                  {row.position}
                </div>
                <div className={`${styles.tableCell} ${styles.tableBodyCell}`}>
                  <div className={styles.team}>
                    {row.team.logoUrl && (
                      <Image
                        src={row.team.logoUrl}
                        alt={`${row.team.name}-logo`}
                        width={40}
                        height={40}
                      />
                    )}
                    <p className={styles.name}>{row.team.name}</p>
                  </div>
                </div>
                <div className={`${styles.tableCell} ${styles.tableBodyCell} numbers`}>
                  {row.matchesPlayed}
                </div>
                <div className={`${styles.tableCell} ${styles.tableBodyCell} numbers`}>
                  {row.wins}
                </div>
                <div className={`${styles.tableCell} ${styles.tableBodyCell} numbers`}>
                  {row.draws}
                </div>
                <div className={`${styles.tableCell} ${styles.tableBodyCell} numbers`}>
                  {row.losses}
                </div>
                <div className={`${styles.tableCell} ${styles.tableBodyCell} numbers`}>
                  {row.goalDifference}
                </div>
                <div
                  className={`${styles.tableCell} ${styles.tableBodyCell} numbers`}
                  style={{ marginRight: '3px' }}
                >
                  {row.points}
                </div>
              </div>
            )
          })}
        </section>
      </div>
    </div>
  )
}

export default Standings
