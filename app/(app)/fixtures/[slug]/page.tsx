import React from 'react'
import { MapPin } from 'lucide-react'
import { notFound } from 'next/navigation'
import type { Metadata, ResolvingMetadata } from 'next'
import { siteOpenGraph } from '@/lib/utils/metadata'
import { venueName } from '@/lib/fixtures/venues'
import { getPayload } from 'payload'
import config from '@payload-config'

import DynamicCountdown from '@/components/Countdown/CountdownTimerDynamic'
import Lineup from '@/components/Fixture/Lineup/Lineup'
import {
  FixtureHeader,
  HeaderContent,
  Top,
  Middle,
  Team,
  TeamName,
  TeamLogo,
  TeamLogoPlaceholder,
  TimeScore,
  Bottom,
} from '@/components/Fixture/SinglePageComponents'
import {
  fixtureFromPayload,
  teamInitials,
  type NormalizedFixture,
} from '@/lib/utils/normalize/sports'
import { cachedFind } from '@/lib/utils/payload/cached'
import JsonLd from '@/components/Seo/JsonLd'
import { absoluteUrl, paths } from '@/lib/seo/site'
import { sportsEventJsonLd } from '@/lib/seo/structuredData'

export const revalidate = 60

// Nothing is pre-built; each page renders on its first visit and is then cached (see `revalidate`).
export function generateStaticParams() {
  return []
}

const DISPLAY_TZ = 'Europe/Malta'


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

const describeFixture = (fixture: NormalizedFixture) => {
  const teams = `${fixture.homeTeam.name} vs ${fixture.awayTeam.name}`
  const competition = fixture.competition?.name ?? 'Handball'
  const { date } = formatDateTime(fixture.startDate)

  return {
    title: `${teams}: ${competition}`,
    description: fixture.isFinished
      ? `Full time: ${fixture.homeTeam.name} ${fixture.homeScore} - ${fixture.awayScore} ${fixture.awayTeam.name}. ${competition}, ${date}.`
      : `${teams} in the ${competition} on ${date}. Team news, kick-off time and live updates from La Salle Handball Club.`,
  }
}

export async function generateMetadata({ params }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const { slug } = await params
  const doc = await getFixture(slug)
  if (!doc) return { title: 'Fixture not found' }

  const fixture = fixtureFromPayload(doc)
  const { title, description } = describeFixture(fixture)
  const canonical = absoluteUrl(paths.fixture(fixture.slug))

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: await siteOpenGraph(parent, { title, description, url: canonical }),
  }
}

const TeamCrest = ({ team }: { team: NormalizedFixture['homeTeam'] }) =>
  team.logoUrl ? (
    <TeamLogo src={team.logoUrl} alt="" />
  ) : (
    <TeamLogoPlaceholder aria-hidden>{teamInitials(team.name)}</TeamLogoPlaceholder>
  )

const FixturePageHeader = ({ fixture }: { fixture: NormalizedFixture }) => {
  const { date, time } = formatDateTime(fixture.startDate)
  const isUpcoming = new Date(fixture.startDate) >= new Date()

  return (
    <header>
      <FixtureHeader>
        <div className="parent fixtures-page">
          <HeaderContent>
            <Top>
              <div className="numbers">{date}</div>
              {fixture.venue ? (
                <div style={{ display: 'inline-flex' }}>
                  <MapPin height={'16px'} /> {venueName(fixture.venue)}
                </div>
              ) : null}
            </Top>

            <Middle>
              <Team $isSecond={false}>
                <TeamName>{fixture.homeTeam.name}</TeamName>
                <TeamCrest team={fixture.homeTeam} />
              </Team>

              <TimeScore className="numbers">
                {fixture.isFinished ? `${fixture.homeScore} - ${fixture.awayScore}` : time}
              </TimeScore>

              <Team $isSecond={true}>
                <TeamName>{fixture.awayTeam.name}</TeamName>
                <TeamCrest team={fixture.awayTeam} />
              </Team>
            </Middle>

            {isUpcoming ? (
              <Bottom className="numbers">
                <h2>The match will start in:</h2>
                <DynamicCountdown targetDate={new Date(fixture.startDate)} />
              </Bottom>
            ) : null}
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
  const { title, description } = describeFixture(fixture)

  return (
    <>
      <JsonLd
        data={sportsEventJsonLd({
          path: paths.fixture(fixture.slug),
          name: title,
          description,
          startDate: fixture.startDate,
          venue: venueName(fixture.venue),
          homeTeam: fixture.homeTeam.name,
          awayTeam: fixture.awayTeam.name,
          competition: fixture.competition?.name,
        })}
      />
      <section>
        <FixturePageHeader fixture={fixture} />
      </section>

      <article className="parent">
        <Lineup
          homeTeam={fixture.homeTeam}
          awayTeam={fixture.awayTeam}
          homeLineup={fixture.homeLineup}
          awayLineup={fixture.awayLineup}
        />
      </article>
    </>
  )
}
