import React from 'react'
import { MapPin } from 'lucide-react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'

import Navbar from '@/components/Hero/Navbar'
import AdSense from '@/components/AdSense/AdSense'
import DynamicCountdown from '@/components/Countdown/CountdownTimerDynamic'
import {
  FixtureHeader,
  HeaderContent,
  Top,
  Middle,
  Team,
  TeamName,
  TeamLogo,
  TimeScore,
  Bottom,
} from '@/components/Fixture/SinglePageComponents'
import { fixtureFromPayload, type NormalizedFixture } from '@/lib/utils/normalize/sports'
import { cachedFind } from '@/lib/utils/payload/cached'

export const revalidate = 60

// Nothing is pre-built; each page renders on its first visit and is then cached (see `revalidate`).
export function generateStaticParams() {
  return []
}

const DISPLAY_TZ = 'Europe/Malta'

/** Codes without an entry here fall back to the code itself. */
const VENUE_NAMES: Record<string, string> = {
  USH: 'University Sports Hall (USH)',
}

const formatDateTime = (iso: string) => ({
  date: new Intl.DateTimeFormat('en-GB', {
    timeZone: DISPLAY_TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso)),
  time: new Intl.DateTimeFormat('en-GB', {
    timeZone: DISPLAY_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso)),
})

/**
 * Looks the fixture up by its public slug, falling back to the document id so
 * that links created before slugs existed keep resolving.
 */
const getFixture = async (slug: string) => {
  const payload = await getPayload({ config })

  const { docs } = await cachedFind({
    collection: 'fixtures',
    where: { slug: { equals: slug } },
    depth: 2,
    limit: 1,
  })

  if (docs[0]) return docs[0]

  try {
    return await payload.findByID({ collection: 'fixtures', id: slug, depth: 2 })
  } catch {
    return null
  }
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const doc = await getFixture(slug)
  if (!doc) return { title: 'Fixture not found | La Salle Handball' }

  const fixture = fixtureFromPayload(doc)
  const teams = `${fixture.homeTeam.name} vs ${fixture.awayTeam.name}`
  const competition = fixture.competition?.name ?? 'Handball'
  const { date } = formatDateTime(fixture.startDate)

  const title = `${teams}: ${competition} | La Salle Handball`
  const description = fixture.isFinished
    ? `Full time: ${fixture.homeTeam.name} ${fixture.homeScore} - ${fixture.awayScore} ${fixture.awayTeam.name}. ${competition}, ${date}.`
    : `${teams} in the ${competition} on ${date}. Team news, kick-off time and live updates from La Salle Handball Club.`

  const baseSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_API_URL
  const canonical = `${baseSiteUrl ?? ''}/fixtures/${fixture.slug}`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical },
  }
}

const FixturePageHeader = ({ fixture }: { fixture: NormalizedFixture }) => {
  const { date, time } = formatDateTime(fixture.startDate)
  const isUpcoming = new Date(fixture.startDate) >= new Date()

  return (
    <header>
      <FixtureHeader>
        <Navbar />
        <div className="parent fixtures-page">
          <HeaderContent>
            <Top>
              <div className="numbers">{date}</div>
              {fixture.venue ? (
                <div style={{ display: 'inline-flex' }}>
                  <MapPin height={'16px'} /> {VENUE_NAMES[fixture.venue] ?? fixture.venue}
                </div>
              ) : null}
            </Top>

            <Middle>
              <Team $isSecond={false}>
                <TeamName>{fixture.homeTeam.name}</TeamName>
                {fixture.homeTeam.logoUrl ? <TeamLogo src={fixture.homeTeam.logoUrl} /> : null}
              </Team>

              <TimeScore className="numbers">
                {fixture.isFinished ? `${fixture.homeScore} - ${fixture.awayScore}` : time}
              </TimeScore>

              <Team $isSecond={true}>
                <TeamName>{fixture.awayTeam.name}</TeamName>
                {fixture.awayTeam.logoUrl ? <TeamLogo src={fixture.awayTeam.logoUrl} /> : null}
              </Team>
            </Middle>

            <Bottom className="numbers">
              {isUpcoming ? (
                <>
                  <h2>The match will start in:</h2>
                  <DynamicCountdown targetDate={new Date(fixture.startDate)} />
                </>
              ) : null}
            </Bottom>
          </HeaderContent>
        </div>
      </FixtureHeader>
    </header>
  )
}

export default async function FixturePage({ params }: Props) {
  const { slug } = await params
  const doc = await getFixture(slug)
  if (!doc) notFound()

  const fixture = fixtureFromPayload(doc)

  return (
    <>
      <section>
        <FixturePageHeader fixture={fixture} />
      </section>

      <section className="parent">
        <AdSense adSlot="4410526483" />
      </section>

      <article className="parent">
        {/* Lineups and per-match scorers aren't modelled in Payload yet. */}
        <p style={{ textAlign: 'center' }}>Line Up Not Available</p>
      </article>
    </>
  )
}
