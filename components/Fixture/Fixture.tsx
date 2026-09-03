import Image from 'next/image'
import Link from 'next/link'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

import styles from './Fixture.module.css'
import { TimeScoreV2 } from './SinglePageComponents'
import type { NormalizedFixture } from '@/lib/utils/normalize/sports'

dayjs.extend(utc)
dayjs.extend(timezone)

const DISPLAY_TZ = 'Europe/Malta'

const formatDateTime = (iso: string) => {
  const d = dayjs(iso).tz(DISPLAY_TZ)
  return { date: d.format('D MMMM YYYY'), time: d.format('HH:mm') }
}

const Fixtures = ({
  showTitle,
  data,
}: {
  showTitle: boolean
  data: NormalizedFixture[]
}) => {
  return (
    <section className={styles.matchContainer}>
      {showTitle && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <h2 className={styles.sectionTitle}>Fixtures</h2>
        </div>
      )}
      <div className={styles.matchWrapper}>
        {data.map((fixture) => {
          const { date, time } = formatDateTime(fixture.startDate)
          return (
            <div className={styles.matchContent} key={fixture.id}>
              <div className={styles.match}>
                <div className={styles.homeTeam}>
                  {fixture.homeTeam.logoUrl && (
                    <div className={styles.teamBadge}>
                      <Image
                        src={fixture.homeTeam.logoUrl}
                        alt={`${fixture.homeTeam.name}-logo`}
                        width={256}
                        height={256}
                        loading="eager"
                      />
                    </div>
                  )}
                  <span className={styles.teamName}>{fixture.homeTeam.name}</span>
                </div>

                <div className={styles.matchDetails}>
                  <div>
                    <div className={`${styles.matchDate} numbers`}>{date}</div>
                    <div className={styles.matchType}>
                      <h4>{fixture.competition?.name ?? ''}</h4>
                    </div>
                  </div>
                  <div className={styles.matchScore}>
                    {fixture.isFinished ? (
                      <span className="numbers">
                        {fixture.homeScore} - {fixture.awayScore}
                      </span>
                    ) : (
                      <TimeScoreV2 className="numbers">{time}</TimeScoreV2>
                    )}
                  </div>
                  <div>
                    <span className={styles.fixtureLink}>
                      <Link href={`/fixtures/${fixture.slug}`}>Match Report</Link>
                    </span>
                  </div>
                </div>

                <div className={styles.awayTeam}>
                  <span className={styles.teamName}>{fixture.awayTeam.name}</span>
                  {fixture.awayTeam.logoUrl && (
                    <div className={styles.teamBadge}>
                      <Image
                        src={fixture.awayTeam.logoUrl}
                        alt={`${fixture.awayTeam.name}-logo`}
                        width={256}
                        height={256}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default Fixtures
