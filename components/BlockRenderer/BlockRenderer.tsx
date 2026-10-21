import type { ComponentType } from 'react'
import { RichText } from '@payloadcms/richtext-lexical/react'

import Hero from '@/components/Hero/Hero'
import PageHeader from '@/components/PageHeader/PageHeader'
import JoinUs from '@/components/JoinUs/JoinUs'
import TeamCarousel from '@/components/Carousel/Team'
import AdSense, { type AdFormat } from '@/components/AdSense/AdSense'
import Advertisement, { type AdCandidate } from '@/components/Advertisement/Advertisement'
import CountdownTimer from '@/components/Countdown/CountdownTimerDynamic'
import SponsorCard from '@/components/Sponsor/sponsorCard'
import sponsorStyles from '@/components/Sponsor/sponsors.module.css'
import PlayerCard from '@/components/PlayerCard/PlayerCard'
import playerCardStyles from '@/components/PlayerCard/PlayerCard.module.css'
import NewsCard from '@/components/News/NewsCard/NewsCard'
import { OtherArticles } from '@/components/StyledComponents'
import Link from 'next/link'
import Fixtures from '@/components/Fixture/Fixture'
import UpcomingMatches from '@/components/Fixture/UpcomingMatches/UpcomingMatches'
import Standings from '@/components/Standings/Standings'
import { fixtureFromPayload, standingFromPayload } from '@/lib/utils/normalize/sports'
import { Partners } from '../Partners/Partners'
import BlockTabs from './BlockTabs'
import { cachedFind } from '@/lib/utils/payload/cached'
import { getGeneralGlobal } from '@/lib/utils/payload/globals'

type Media = { url?: string; alt?: string; filename?: string } | string | null | undefined
type Ref = { id: string | number } | string | number | null | undefined

type BlockNode = { blockType: string; id?: string } & Record<string, any>

// An unpopulated upload is just its ID, which is not a usable URL.
const mediaUrl = (m: Media): string => (m && typeof m === 'object' ? (m.url ?? '') : '')

const mediaAlt = (m: Media): string | undefined =>
  m && typeof m === 'object' ? m.alt || undefined : undefined

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
      alt: s.caption || mediaAlt(s.image),
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
      ?.map((s) => ({ src: mediaUrl(s.image), alt: s.alt || mediaAlt(s.image) }))
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

const JoinUsAdapter = (props: {
  heading?: string
  body?: string
  ctaLabel?: string
  ctaLink?: string
  backgroundImage?: Media
}) => (
  <JoinUs
    heading={props.heading}
    body={props.body}
    ctaLabel={props.ctaLabel}
    ctaLink={props.ctaLink}
    backgroundImage={mediaUrl(props.backgroundImage) || null}
  />
)

const PartnersAdapter = ({
  heading,
  partners,
}: {
  heading?: string
  partners?: Array<{ name: string; image: Media; link?: string }>
}) => (
  <Partners
    heading={heading}
    partners={(partners ?? [])
      .map((p) => ({ name: p.name, src: mediaUrl(p.image), link: p.link }))
      .filter((p) => p.src)}
  />
)

const CarouselAdapter = ({
  items,
}: {
  items?: Array<{ image: Media; title: string; description?: string; ctaLabel?: string; ctaLink: string }>
}) => (
  <TeamCarousel
    items={(items ?? [])
      .map((item) => ({
        src: mediaUrl(item.image),
        alt: mediaAlt(item.image),
        title: item.title,
        description: item.description,
        ctaLabel: item.ctaLabel,
        ctaLink: item.ctaLink,
      }))
      .filter((item) => item.src)}
  />
)

const NewsSectionAdapter = async ({
  heading,
  layout,
  limit,
  tags,
  showViewAll,
}: {
  heading?: string
  layout?: 'grid' | 'list' | 'featured'
  limit?: number
  tags?: Array<{ tag: string }>
  showViewAll?: boolean
}) => {
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
  if (!docs.length) return null
  const [featured, ...rest] = docs

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
          {heading || 'Latest News'}
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
      {layout === 'list' ? (
        <div style={{ maxWidth: 720 }}>
          {docs.map((post) => (
            <NewsCard key={post.id} data={post} />
          ))}
        </div>
      ) : layout === 'featured' && featured ? (
        <>
          <NewsCard data={featured} />
          <OtherArticles>
            {rest.map((post) => (
              <NewsCard key={post.id} data={post} />
            ))}
          </OtherArticles>
        </>
      ) : (
        <OtherArticles>
          {docs.map((post) => (
            <NewsCard key={post.id} data={post} />
          ))}
        </OtherArticles>
      )}
    </section>
  )
}

const AdSlotAdapter = ({ adSlot, format }: { adSlot: string; format?: AdFormat | null }) => (
  <AdSense adSlot={adSlot} format={format} />
)

const AdvertisementAdapter = async ({
  source,
  format,
  ads,
}: {
  source?: 'rotate' | 'chosen' | null
  format?: AdCandidate['format'] | null
  ads?: Ref[] | null
}) => {
  const where: Record<string, any> = { active: { equals: true } }
  if (source === 'chosen') {
    const ids = (ads ?? []).map(refId).filter((id) => id != null)
    if (!ids.length) return null
    where.id = { in: ids }
  } else {
    where.format = { equals: format ?? 'banner' }
  }

  const { docs } = await cachedFind({ collection: 'advertisements', where, depth: 1, limit: 50 })
  const candidates: AdCandidate[] = docs
    .map((ad: any) => ({
      id: String(ad.id),
      format: ad.format,
      imageUrl: mediaUrl(ad.image),
      mobileImageUrl: mediaUrl(ad.mobileImage) || undefined,
      alt: ad.alt ?? '',
      startDate: ad.startDate ?? undefined,
      endDate: ad.endDate ?? undefined,
    }))
    .filter((ad) => ad.imageUrl)
  if (!candidates.length) return null

  // Chosen ads can mix formats; the slot takes the first one's shape.
  return <Advertisement format={source === 'chosen' ? candidates[0].format : (format ?? 'banner')} ads={candidates} />
}

// The counter is styled for a dark background (white tiles and labels).
const CountdownAdapter = ({ heading, targetDate }: { heading?: string; targetDate: string }) => (
  <section style={{ background: 'var(--gradient-brand)', padding: '40px 0' }}>
    <div className="parent" style={{ margin: '0 auto', textAlign: 'center', color: '#fff' }}>
      {heading ? <h2 className="title">{heading}</h2> : null}
      <CountdownTimer targetDate={new Date(targetDate)} />
    </div>
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
    <div className={sponsorStyles.sponsorWrapper}>
      {sponsors?.filter((s) => mediaUrl(s.image)).map((s, i) => (
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

  const where: Record<string, any> = { team: { equals: teamId } }
  if (position && position !== 'all') where.position = { equals: position }

  const { docs } = await cachedFind({
    collection: 'players',
    where,
    depth: 1,
    limit: 100,
    sort: 'number',
  })
  // Players without a photo use the Fallback Image in Site Settings.
  const { fallbackImageUrl } = await getGeneralGlobal()

  return (
    <section className="parent" style={{ padding: '2rem 0' }}>
      {heading ? <h2 className="title">{heading}</h2> : null}
      <ul className={playerCardStyles.playerGrid}>
        {docs.map((p: any) => (
          <PlayerCard
            key={p.id}
            playerInfo={{
              number: p.number,
              firstName: p.firstName,
              lastName: p.lastName,
              position: p.position,
            }}
            profilePicture={mediaUrl(p.profilePicture) || fallbackImageUrl}
          />
        ))}
      </ul>
    </section>
  )
}

const HOUR = 60 * 60 * 1000

/** Three hours ago, rounded down to the hour so the query (and its cache key) changes hourly. */
const playedCutoff = () => new Date(Math.floor(Date.now() / HOUR) * HOUR - 3 * HOUR).toISOString()

const FixtureListAdapter = async ({
  layout,
  showCategoryFilter,
  showTitle,
  title,
  competition,
  team,
  statuses,
  limit,
  sortOrder,
}: {
  layout?: 'cards' | 'list' | null
  showCategoryFilter?: boolean | null
  showTitle?: boolean
  title?: string
  competition?: Ref
  team?: Ref
  statuses?: string[]
  limit?: number
  sortOrder?: 'asc' | 'desc'
}) => {
  const onlyScheduled = statuses?.length === 1 && statuses[0] === 'Scheduled'
  const asCards = layout ? layout === 'cards' : onlyScheduled
  const withTabs = asCards && showCategoryFilter !== false
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

  // Upcoming cards skip matches that have been played but not yet marked finished.
  if (asCards && onlyScheduled) where.startDate = { greater_than: playedCutoff() }

  const { docs } = await cachedFind({
    collection: 'fixtures',
    where,
    depth: 2,
    // With tabs every category needs its own `limit` cards, so fetch them all and split later.
    limit: withTabs ? 100 : (limit ?? 10),
    sort: sortOrder === 'desc' ? '-startDate' : 'startDate',
  })

  if (asCards) {
    return (
      <UpcomingMatches
        title={showTitle ? (title ?? 'Upcoming Matches') : undefined}
        fixtures={docs.map(fixtureFromPayload)}
        limit={limit ?? 10}
        showCategoryFilter={withTabs}
      />
    )
  }

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
    <BlockTabs
      labels={tabs.map((t) => t.label)}
      panels={tabs.map((t, i) => (
        <BlockRenderer key={i} blocks={t.content} />
      ))}
    />
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
  advertisement: AdvertisementAdapter,
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
