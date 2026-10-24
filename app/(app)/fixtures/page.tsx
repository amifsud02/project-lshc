import type { Metadata, ResolvingMetadata } from 'next'

import FixturesHub from '@/components/Fixture/FixturesHub/FixturesHub'
import PageHeader from '@/components/PageHeader/PageHeader'
import JsonLd from '@/components/Seo/JsonLd'
import { isFixtureCategory } from '@/lib/fixtures/categories'
import { paths } from '@/lib/seo/site'
import { breadcrumbJsonLd } from '@/lib/seo/structuredData'
import { siteOpenGraph } from '@/lib/utils/metadata'
import { fixtureFromPayload } from '@/lib/utils/normalize/sports'
import { cachedFind } from '@/lib/utils/payload/cached'

export const revalidate = 60

const TITLE = 'Fixtures and Results'
const DESCRIPTION =
  'Upcoming matches and results for every La Salle Handball Club team in Malta this season: men, women, U19 and youth, with dates, venues, scores and line-ups.'

export async function generateMetadata(_: unknown, parent: ResolvingMetadata): Promise<Metadata> {
  return {
    title: TITLE,
    description: DESCRIPTION,
    // The team filter only narrows this page, so every filtered view points here.
    alternates: { canonical: paths.fixtures },
    openGraph: await siteOpenGraph(parent, { title: TITLE, description: DESCRIPTION, url: paths.fixtures }),
  }
}

const HOUR = 60 * 60 * 1000

/** Matches that started over three hours ago and aren't marked finished yet are left out of "upcoming". */
const playedCutoff = () => new Date(Math.floor(Date.now() / HOUR) * HOUR - 3 * HOUR).toISOString()

/** Maltese seasons run from late summer to spring, so a season starts on 1 July. */
const currentSeason = (now = new Date()) => {
  const year = now.getUTCMonth() >= 6 ? now.getUTCFullYear() : now.getUTCFullYear() - 1
  return { start: new Date(Date.UTC(year, 6, 1)).toISOString(), label: `${year}/${String(year + 1).slice(2)}` }
}

type Props = { searchParams: Promise<{ category?: string }> }

export default async function FixturesPage({ searchParams }: Props) {
  const { category } = await searchParams
  const season = currentSeason()

  const [upcoming, results] = await Promise.all([
    cachedFind({
      collection: 'fixtures',
      where: { and: [{ status: { equals: 'Scheduled' } }, { startDate: { greater_than: playedCutoff() } }] },
      depth: 2,
      limit: 200,
      sort: 'startDate',
    }),
    cachedFind({
      collection: 'fixtures',
      where: { and: [{ status: { equals: 'Finished' } }, { startDate: { greater_than_equal: season.start } }] },
      depth: 2,
      limit: 300,
      sort: '-startDate',
    }),
  ])

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([[TITLE, paths.fixtures]])} />
      <PageHeader pageName={TITLE} asHeading />
      <FixturesHub
        season={season.label}
        upcoming={upcoming.docs.map(fixtureFromPayload)}
        results={results.docs.map(fixtureFromPayload)}
        category={isFixtureCategory(category) ? category : undefined}
      />
    </>
  )
}
