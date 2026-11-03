import path from 'node:path'
import type { Payload } from 'payload'

import { SEED_PAGES } from './pages'

/**
 * The club pages that used to be written in code (history, sponsors, management, contact, youth
 * teams, member benefits), as CMS pages at the same addresses and with the same wording, so editors
 * can change them in the admin.
 */

const header = (pageName: string) => ({ blockType: 'pageHeader', variant: 'inner', pageName })

const history = SEED_PAGES.find((p) => p.slug === 'club/history')!

type SponsorSeed = { name: string; file: string; link?: string }

const MAIN_PARTNERS: SponsorSeed[] = [
  { name: 'Il-Karrettun Pub & Grill', file: 'il-karrettun.png', link: 'https://www.facebook.com/karettun/' },
  { name: 'Universal Air', file: 'universal-air.png', link: 'https://universalair.aero/' },
  { name: 'MBI', file: 'mbi.png', link: 'https://www.facebook.com/MBImizzibrothersinstallations/' },
  { name: 'Metalco Ltd.', file: 'metalco.png', link: 'http://metalcoltd.com/' },
]

const PARTNERS: SponsorSeed[] = [
  { name: '1Padel', file: '1padel.png', link: 'https://www.1padelmalta.com/' },
  { name: 'Web Monkeyz', file: 'web-monkeyz.png', link: 'https://www.webmonkeyz.com/' },
  { name: 'JTI', file: 'jti.png' },
  { name: 'Maypole', file: 'maypole.png', link: 'https://www.maypole.com.mt/' },
  { name: 'Teamsport', file: 'teamsport.png', link: 'https://darmaningroup.com/teamsport/' },
]

/** The sponsor's logo in Media, uploaded from /public/sponsors the first time. */
async function sponsorLogo(payload: Payload, sponsor: SponsorSeed) {
  const alt = `${sponsor.name} logo`
  const { docs } = await payload.find({ collection: 'media', where: { alt: { equals: alt } }, limit: 1, depth: 0 })
  if (docs[0]) return docs[0].id
  const doc = await payload.create({
    collection: 'media',
    data: { alt },
    filePath: path.join(process.cwd(), 'public', 'sponsors', sponsor.file),
  })
  return doc.id
}

const sponsorGrid = async (payload: Payload, heading: string, sponsors: SponsorSeed[]) => ({
  blockType: 'sponsorGrid',
  heading,
  sponsors: await Promise.all(
    sponsors.map(async (s) => ({ name: s.name, image: await sponsorLogo(payload, s), ...(s.link ? { link: s.link } : {}) })),
  ),
})

const sitePages = async (payload: Payload) => [
  {
    title: 'Club history',
    slug: 'club/history',
    // The starter draft this may replace had its own meta title; the page title is enough.
    seoTitle: null,
    seoDescription:
      "How La Salle Handball Club was founded at De La Salle College in 1998 by Alan Grima, and started Malta's first handball nursery.",
    layout: history.layout,
  },
  {
    title: 'Sponsors',
    slug: 'club/sponsors',
    seoDescription:
      'Explore the valued partners and official sponsors of La Salle Handball Club, standing by our players in every match.',
    layout: [
      header('Our Partners'),
      await sponsorGrid(payload, 'Main Partners', MAIN_PARTNERS),
      await sponsorGrid(payload, 'Partners', PARTNERS),
    ],
  },
  {
    title: 'Management',
    slug: 'club/management',
    seoDescription:
      'Meet the La Salle Handball leadership: President, Vice-President, and Sports Director of your team.',
    // Still empty, so it stays out of search results until someone fills it in.
    noIndex: true,
    layout: [header('Management')],
  },
  {
    title: 'Contact us',
    slug: 'contact',
    seoDescription:
      'Contact La Salle Handball Club in Malta about playing, the Handball Academy, sponsorship or matches. Email info@lasallehandball.com.',
    layout: [
      header('Contact Us'),
      { blockType: 'adSlot', adSlot: '4410526483', format: 'auto' },
      {
        blockType: 'contactForm',
        heading: 'Get in touch',
        intro: "Questions about the club, the nursery or anything else? Send us a message and we'll get back to you.",
      },
    ],
  },
  {
    title: 'Youth teams',
    slug: 'teams/youth-teams',
    seoDescription:
      "La Salle Handball Club's youth teams in Malta: academy training for ages 5–16, youth league and cup fixtures, and match reports.",
    layout: [
      header('Youth teams'),
      {
        blockType: 'linkCards',
        intro:
          "La Salle's youth players train in the club's Handball Academy, which started in 1998 as Malta's first handball nursery, and play in the Malta Handball Association's youth leagues and cups for boys and girls.",
        cards: [
          {
            eyebrow: 'Ages 5–16',
            title: 'Join the Handball Academy',
            text: 'Training schedule, venues, fees and online registration for boys and girls.',
            url: '/academy',
          },
          {
            eyebrow: 'This season',
            title: 'Youth fixtures and results',
            text: 'Every La Salle match, from the under-13s to the first teams, with times and venues.',
            url: '/fixtures',
          },
          {
            eyebrow: 'Weekly round-ups',
            title: 'Match reports',
            text: 'How the youth teams got on, with results and standout players.',
            url: '/news/match-reports',
          },
        ],
      },
    ],
  },
  {
    title: 'Member benefits',
    slug: 'membership/benefits',
    seoDescription: "Discounts La Salle Handball Club members get with the club's partners across Malta.",
    layout: [
      header('Member benefits'),
      {
        blockType: 'memberBenefits',
        intro:
          'Show your digital membership card at the till to get your discount. Some partners give members a code to use online instead.',
        emptyText: 'Partner discounts for this season will be announced soon.',
      },
    ],
  },
]

export type SitePageResult = { slug: string; action: 'created' | 'adopted' | 'skipped' }

/**
 * Creates each page, published, unless a page already has its address; existing pages are never
 * touched. The one exception is the unpublished starter "history" page, which becomes /club/history.
 */
export async function seedSitePages(payload: Payload): Promise<SitePageResult[]> {
  const results: SitePageResult[] = []
  for (const page of await sitePages(payload)) {
    const find = (slug: string) =>
      payload.find({ collection: 'pages', where: { slug: { equals: slug } }, draft: true, limit: 1, depth: 0 })
    if ((await find(page.slug)).totalDocs > 0) {
      results.push({ slug: page.slug, action: 'skipped' })
      continue
    }
    const data = { ...page, _status: 'published' } as any
    const starter = page.slug === 'club/history' ? (await find('history')).docs[0] : undefined
    if (starter && starter._status !== 'published') {
      await payload.update({ collection: 'pages', id: starter.id, data })
      results.push({ slug: page.slug, action: 'adopted' })
    } else {
      await payload.create({ collection: 'pages', data })
      results.push({ slug: page.slug, action: 'created' })
    }
  }
  return results
}
