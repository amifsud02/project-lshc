import Link from 'next/link'
import type { Metadata, ResolvingMetadata } from 'next'
import PageHeader from '@/components/PageHeader/PageHeader'
import { siteOpenGraph } from '@/lib/utils/metadata'
import styles from './yt.module.css'

export const revalidate = 60

const title = 'Youth teams'
const description =
  "La Salle Handball Club's youth teams in Malta: academy training for ages 5–16, youth league and cup fixtures, and match reports."

export async function generateMetadata(_: unknown, parent: ResolvingMetadata): Promise<Metadata> {
  return {
    title,
    description,
    alternates: { canonical: '/teams/youth-teams' },
    openGraph: await siteOpenGraph(parent, { title, description, url: '/teams/youth-teams' }),
  }
}

/** Where to find the youth teams: they train in the academy and their matches are on /fixtures. */
const YouthTeams = () => (
  <>
    <PageHeader pageName="Youth teams" asHeading />
    <section className={`parent ${styles.youth}`}>
      <p className={styles.lead}>
        La Salle&apos;s youth players train in the club&apos;s Handball Academy, which started in 1998 as Malta&apos;s first
        handball nursery, and play in the Malta Handball Association&apos;s youth leagues and cups for boys and girls.
      </p>
      <div className={styles.cards}>
        <Link href="/academy" className={`card ${styles.card}`}>
          <span className="eyebrow">Ages 5–16</span>
          <h2>Join the Handball Academy</h2>
          <p>Training schedule, venues, fees and online registration for boys and girls.</p>
        </Link>
        <Link href="/fixtures" className={`card ${styles.card}`}>
          <span className="eyebrow">This season</span>
          <h2>Youth fixtures and results</h2>
          <p>Every La Salle match, from the under-13s to the first teams, with times and venues.</p>
        </Link>
        <Link href="/news/match-reports" className={`card ${styles.card}`}>
          <span className="eyebrow">Weekly round-ups</span>
          <h2>Match reports</h2>
          <p>How the youth teams got on, with results and standout players.</p>
        </Link>
      </div>
    </section>
  </>
)

export default YouthTeams
