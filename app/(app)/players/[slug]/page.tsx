import type { Metadata, ResolvingMetadata } from 'next'
import { notFound } from 'next/navigation'

import PageHeader from '@/components/PageHeader/PageHeader'
import PlayerProfile from '@/components/Player/PlayerProfile'
import JsonLd from '@/components/Seo/JsonLd'
import { getPlayerMatches, getPlayerProfile } from '@/lib/players/data'
import { describePlayer, playerName, positionLabel } from '@/lib/players/profile'
import { mediaUrl, truncate } from '@/lib/seo/meta'
import { paths } from '@/lib/seo/site'
import { breadcrumbJsonLd, personJsonLd } from '@/lib/seo/structuredData'
import { siteOpenGraph } from '@/lib/utils/metadata'

export const revalidate = 60

// Nothing is pre-built; each page renders on its first visit and is then cached (see `revalidate`).
export function generateStaticParams() {
  return []
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const { slug } = await params
  const player = await getPlayerProfile(slug)
  if (!player) return { title: 'Player not found' }

  const name = playerName(player)
  const title = `${name}, ${positionLabel(player.position) ?? 'Handball player'}`
  const description = truncate(describePlayer(player).description)
  const path = paths.player(slug)
  const image = mediaUrl(player.profilePicture)

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: await siteOpenGraph(parent, {
      type: 'profile',
      title,
      description,
      url: path,
      ...(image ? { images: [image] } : {}),
    }),
  }
}

export default async function PlayerPage({ params }: Props) {
  const { slug } = await params
  const player = await getPlayerProfile(slug)
  if (!player) notFound()

  const matches = await getPlayerMatches(String(player.id))
  const name = playerName(player)
  const path = paths.player(slug)

  return (
    <>
      <JsonLd
        data={[
          personJsonLd({
            path,
            name,
            description: describePlayer(player).description,
            image: mediaUrl(player.profilePicture),
            jobTitle: player.position === 'Coach' ? 'Handball coach' : 'Handball player',
            team: typeof player.team === 'object' ? player.team?.teamName : undefined,
          }),
          breadcrumbJsonLd([[name, path]]),
        ]}
      />
      <PageHeader pageName={name} asHeading />
      <PlayerProfile player={player} matches={matches} />
    </>
  )
}
