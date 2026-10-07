import type { ComponentType } from 'react'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { getPayload } from 'payload'
import config from '@payload-config'

import Hero from '@/components/Hero/Hero'
import PageHeader from '@/components/PageHeader/PageHeader'
import JoinUs from '@/components/JoinUs/JoinUs'
import TeamCarousel from '@/components/Carousel/Team'
import AdSense, { type AdFormat } from '@/components/AdSense/AdSense'
import CountdownTimer from '@/components/Countdown/CountdownTimerDynamic'
import SponsorCard from '@/components/Sponsor/sponsorCard'
import PlayerCard from '@/components/PlayerCard/PlayerCard'
import NewsCard from '@/components/News/NewsCard/NewsCard'
import { OtherArticles } from '@/components/StyledComponents'
import Link from 'next/link'
import Fixtures from '@/components/Fixture/Fixture'
import Standings from '@/components/Standings/Standings'
import { fixtureFromPayload, standingFromPayload } from '@/lib/utils/normalize/sports'
import { Partners } from '../Partners/Partners'
import { cachedFind } from '@/lib/utils/payload/cached'

type Media = { url?: string; alt?: string; filename?: string } | string | null | undefined
type Ref = { id: string | number } | string | number | null | undefined

type BlockNode = { blockType: string; id?: string } & Record<string, any>

const mediaUrl = (m: Media): string => {
  if (!m) return ''
  if (typeof m === 'string') return m
  return m.url ?? ''
}

const refId = (r: Ref): string | number | undefined => {
  if (r == null) return undefined
  if (typeof r === 'object') return r.id
  return r
}

const HeroAdapter = ({
  title,
  slides,
}: {
  title?: any
  slides?: Array<{ image: Media; caption?: string }>
}) => {
  const heroSlides = slides
    ?.map((s) => ({
      src: mediaUrl(s.image),
      alt: s.caption ?? (typeof s.image === 'object' ? s.image?.alt : undefined),
    }))
    .filter((s) => s.src)
  return <Hero title={title ?? undefined} slides={heroSlides} />
}

const PageHeaderAdapter = (props: {
  variant?: 'inner' | 'landing'
  pageName?: string
  title?: string
  subtitle?: string
  slides?: Array<{ image: Media; alt?: string }>
  social?: { facebook?: string; instagram?: string; tiktok?: string }
}) => {
  if (props.variant === 'landing') {
    const slides = props.slides
      ?.map((s) => ({ src: mediaUrl(s.image), alt: s.alt }))
      .filter((s) => s.src)
    return (
      <PageHeader
        variant="landing"
        title={props.title}
        subtitle={props.subtitle}
        slides={slides}
        social={props.social}
      />
    )
  }
  return <PageHeader pageName={props.pageName ?? ''} />
}

const JoinUsAdapter = () => <JoinUs />
const PartnersAdapter = () => <Partners />
const CarouselAdapter = () => <TeamCarousel />

const NewsSectionAdapter = async ({
  heading,
  limit,
  tags,
  showViewAll,
}: {
  heading?: string
  limit?: number
  tags?: Array<{ tag: string }>
  showViewAll?: boolean
}) => {
  const payload = await getPayload({ config })
  const where: Record<string, any> = {}
  const tagValues = tags?.map((t) => t.tag).filter(Boolean) ?? []
  if (tagValues.length) where.tags = { in: tagValues }

  const { docs } = await cachedFind({
    collection: 'news',
    where,
    depth: 1,
    limit: limit ?? 6,
    sort: '-publishedAt',
  })

  return (
    <section className="parent" style={{ paddingTop: 50, paddingBottom: 50 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <h2 style={{ fontSize: 24, fontWeight: 800, textTransform: 'uppercase' }}>
          {heading ?? 'Latest posts'}
        </h2>
        {showViewAll ? (
          <Link
            href="/news"
            style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: 12 }}
          >
            View all
          </Link>
        ) : null}
      </div>
      <OtherArticles>
        {docs.map((post: any) => (
          <NewsCard key={post.id} data={post} />
        ))}
      </OtherArticles>
    </section>
  )
}

const AdSlotAdapter = ({ adSlot, format }: { adSlot: string; format?: AdFormat | null }) => (
  <AdSense adSlot={adSlot} format={format} />
)

const CountdownAdapter = ({ heading, targetDate }: { heading?: string; targetDate: string }) => (
  <section className="parent">
    {heading ? <h2 className="title">{heading}</h2> : null}
    <CountdownTimer targetDate={new Date(targetDate)} />
  </section>
)

const RichTextAdapter = ({ content, width }: { content: any; width?: 'prose' | 'full' }) => (
  <section className="parent">
    <div className={width === 'full' ? '' : 'prose mx-auto'}>
      <RichText data={content} />
    </div>
  </section>
)

const SponsorGridAdapter = ({
  heading,
  sponsors,
}: {
  heading?: string
  sponsors?: Array<{ name: string; image: Media; link?: string }>
}) => (
  <section className="parent">
    {heading ? <h2 className="title">{heading}</h2> : null}
    <div className="sponsor-grid">
      {sponsors?.map((s, i) => (
        <SponsorCard
          key={i}
          sponsorName={s.name}
          sponsorImage={mediaUrl(s.image)}
          sponsorLink={s.link ?? '#'}
        />
      ))}
    </div>
  </section>
)

const PLAYER_PLACEHOLDER =
  'https://res.cloudinary.com/dg6n3ybac/image/upload/f_auto,q_auto/v1/media/player-placeholder'

const PlayerGridAdapter = async ({
  heading,
  team,
  position,
}: {
  heading?: string
  team?: Ref
  position?: string
}) => {
  const teamId = refId(team)
  if (!teamId) return null

  const payload = await getPayload({ config })
  const where: Record<string, any> = { team: { equals: teamId } }
  if (position && position !== 'all') where.position = { equals: position }

  const { docs } = await cachedFind({
    collection: 'players',
    where,
    depth: 1,
    limit: 100,
    sort: 'number',
  })

  return (
    <section className="parent" style={{ padding: '2rem 0' }}>
      {heading ? <h2 className="title">{heading}</h2> : null}
      <ul
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '16px',
          listStyle: 'none',
          padding: 0,
        }}
      >
        {docs.map((p: any) => (
          <PlayerCard
            key={p.id}
            playerInfo={{
              number: p.number,
              firstName: p.firstName,
              lastName: p.lastName,
              position: p.position,
            }}
            profilePicture={mediaUrl(p.profilePicture) || PLAYER_PLACEHOLDER}
          />
        ))}
      </ul>
    </section>
  )
}

const FixtureListAdapter = async ({
  showTitle,
  title,
  competition,
  team,
  statuses,
  limit,
  sortOrder,
}: {
  showTitle?: boolean
  title?: string
  competition?: Ref
  team?: Ref
  statuses?: string[]
  limit?: number
  sortOrder?: 'asc' | 'desc'
}) => {
  const payload = await getPayload({ config })
  const where: Record<string, any> = {}

  const competitionId = refId(competition)
  if (competitionId) where.competition = { equals: competitionId }

  const teamId = refId(team)
  if (teamId) {
    where.or = [
      { homeTeam: { equals: teamId } },
      { awayTeam: { equals: teamId } },
    ]
  }

  if (statuses?.length) where.status = { in: statuses }

  const { docs } = await cachedFind({
    collection: 'fixtures',
    where,
    depth: 2,
    limit: limit ?? 10,
    sort: sortOrder === 'desc' ? '-startDate' : 'startDate',
  })

  return (
    <section className="parent" style={{ padding: '2rem 0' }}>
      {showTitle ? <h2 className="title">{title ?? 'Fixtures'}</h2> : null}
      {docs.length === 0 ? (
        <p style={{ color: '#666' }}>No fixtures found.</p>
      ) : (
        <Fixtures showTitle={false} data={docs.map(fixtureFromPayload)} />
      )}
    </section>
  )
}

const StandingsAdapter = async ({
  showTitle,
  title,
  competition,
}: {
  showTitle?: boolean
  title?: string
  competition?: Ref
}) => {
  const competitionId = refId(competition)
  if (!competitionId) return null

  const payload = await getPayload({ config })
  const { docs } = await cachedFind({
    collection: 'standings',
    where: { competition: { equals: competitionId } },
    depth: 2,
    limit: 1,
  })

  const standing = docs[0]
  if (!standing) return null

  const normalized = standingFromPayload(standing)
  if (title) normalized.title = title

  return (
    <section className="parent" style={{ padding: '2rem 0' }}>
      <Standings showTitle={showTitle ?? true} data={normalized} />
    </section>
  )
}

const TabAdapter = ({
  tabs,
}: {
  tabs?: Array<{ label: string; content?: BlockNode[] }>
}) => {
  if (!tabs?.length) return null
  return (
    <section className="parent">
      {tabs.map((t, i) => (
        <div key={i} data-tab-label={t.label}>
          <h3>{t.label}</h3>
          <BlockRenderer blocks={t.content} />
        </div>
      ))}
    </section>
  )
}

const REGISTRY: Record<string, ComponentType<any>> = {
  hero: HeroAdapter,
  pageHeader: PageHeaderAdapter,
  richText: RichTextAdapter,
  newsSection: NewsSectionAdapter,
  fixtureList: FixtureListAdapter,
  standings: StandingsAdapter,
  playerGrid: PlayerGridAdapter,
  carousel: CarouselAdapter,
  sponsorGrid: SponsorGridAdapter,
  partners: PartnersAdapter,
  joinUs: JoinUsAdapter,
  countdown: CountdownAdapter,
  tab: TabAdapter,
  adSlot: AdSlotAdapter,
}

export function BlockRenderer({ blocks }: { blocks?: BlockNode[] | null }) {
  if (!blocks?.length) return null
  return (
    <>
      {blocks.map((block, i) => {
        const Component = REGISTRY[block.blockType]
        if (!Component) return null
        return <Component key={block.id ?? `${block.blockType}-${i}`} {...block} />
      })}
    </>
  )
}

export default BlockRenderer
