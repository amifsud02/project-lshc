import type { Payload } from 'payload'

import type { Page } from '@/payload-types'

import { h, p, richText, ul } from './lexical'

type SeedPage = Pick<Page, 'title' | 'slug' | 'layout' | 'seoTitle' | 'seoDescription'>

const PARTNER_DISCOUNTS: Record<string, string[]> = {
  'Food & drinks': [
    'Bistro 516 — 15% off food',
    'Brass & Knuckle — 15% off the final bill, Monday to Thursday',
    'CHIARO Trattoria & Grill — 10% off dining or breakfast, or a complimentary platter at Happy Hour (15:00–19:00)',
    'Coffee Fellows — 10% off',
    'Crust Bistro & The Game & Ale Pub — 15% off, Monday to Friday',
    'Cuba — 10% off the whole bill, Monday to Friday',
    'Danny’s Kitchen & Deli — 15% off the food bill',
    'J’Oli Sandwich Salad Bar — 10% off online orders with code LASALLE10',
    'Marrobbio Restaurant — 10% off',
    'Rossopomodoro — member discount 7 days a week, including public holidays',
    'Two Buoys — 10% off when dining at the restaurant',
  ],
  'Health & fitness': [
    'Darmanin Group & Teamsport — €5 + €15 vouchers and double points via the Darmanin Plus app',
    'Honest Care Ltd. — 10% off non-medical products',
    'Scram Gym — 20% off gym memberships (22% off 1-year) and 25% off strength & conditioning',
    'Surplus & Adventure Shop — 10% off all stock (excluding sale items)',
  ],
  'Entertainment': [
    'Deck & Beyond — 10% off with code LASALLE10',
    'Museum of Illusions Malta — 15% off tickets bought at the door',
    'Planet Play — 15% off tickets on selected attractions',
  ],
  'Retail, hair & beauty': [
    'BDL - Book Distributors Limited — 10% off in-store purchases',
    'Lilly & Co. Essentials — 10% off hair products with code LASALLE10',
    'Boggi Milano, Elisabetta Franchi, Guess, Harmont & Blaine, Kiko Milano, Nespresso and Paul & Shark — member discount on presentation of your card',
  ],
}

/**
 * Starting content for the CMS-driven pages. Blocks that need an uploaded image
 * (sponsors, partners, carousels) are left out so the seed only ever touches the
 * pages collection; add those from the admin once the images are in Media.
 */
export const SEED_PAGES: SeedPage[] = [
  {
    title: 'Home',
    slug: 'home',
    seoTitle: 'La Salle Handball Club | Malta',
    seoDescription:
      'La Salle Handball Club — fixtures, results, news and teams from one of Malta’s leading handball clubs.',
    layout: [
      { blockType: 'hero' },
      {
        blockType: 'fixtureList',
        showTitle: true,
        title: 'Upcoming Fixtures',
        statuses: ['Scheduled'],
        sortOrder: 'asc',
        limit: 6,
      },
      {
        blockType: 'fixtureList',
        showTitle: true,
        title: 'Latest Results',
        statuses: ['Finished'],
        sortOrder: 'desc',
        limit: 5,
      },
      { blockType: 'newsSection', heading: 'Latest News', layout: 'featured', limit: 6, showViewAll: true },
      {
        blockType: 'joinUs',
        heading: 'Join La Salle Handball',
        body: 'From our nursery to the senior teams, there is a place for you at La Salle. Become a member and be part of the club.',
        ctaLabel: 'Become a member',
        ctaLink: '/membership',
      },
    ],
  },
  {
    title: 'Our History',
    slug: 'history',
    seoTitle: 'History of La Salle Handball | La Salle Handball',
    seoDescription:
      'Malta’s handball legends: EHF Cup contenders, national league champions, and more. Explore our rich history!',
    layout: [
      { blockType: 'pageHeader', variant: 'inner', pageName: 'Our History' },
      {
        blockType: 'richText',
        width: 'prose',
        content: richText(
          p(
            'Alan Grima had been working as a Physical Education teacher at De La Salle College for a year and had seen the big opportunity which existed. Originally one of the founders of the Malta Handball Association and co-founder of Birzebbugia Handball Club (that won the first men’s senior national league, but withdrew from all competitions the following season), Alan started working hard on fulfilling his dream - founding the La Salle Handball Club.',
          ),
          p(
            'This came about following a lot of hard work which culminated after guiding the Maltese Under 17 boys in the FISEC handball competition held in Gran Canaria in July 1998. His dream would not have come true without the support of Christian Bonett, Alistair Vella, Renzo Kerr Cumbo and Keith Monaco who helped him in his venture. A call for interested players, a players’ meeting was set up in August 1998 where full details were given.',
          ),
          p(
            'Alan Grima was backed by John Taylor, the then Head of the Physical Education Department at De La Salle who gave his impeccable assistance and went out of his way many times, as did Joe Mallia, Gino Mallia and Daniel Buhagiar who helped the club obtain a three year sponsorship deal with the Grech brothers of Mirechem Ltd.',
          ),
          p(
            'It was also important for Alan Grima to set up the club’s handball nursery something which was done immediately in the first year. It was the first handball nursery in Malta with a group of around 15 Form 1 and Form 2 students attending training regularly after school, making it an immediate success. Throughout the years the Club has always sought to give the youngsters of De La Salle College, not only the possibility to learn the basics of the game in a disciplined and enjoyable way, but also the opportunity to get into senior handball, and indeed beyond, actually forming part of national teams at various age levels.',
          ),
          h('h3', 'Our aims'),
          p(
            'Since its foundation, the LSHC always aimed to promote and develop the game of Handball at De La Salle College and in Malta by:',
          ),
          ul([
            'Fostering interest in, and knowledge about Handball at De La Salle College.',
            'Developing a solid and permanent youth nursery for the benefit of De La Salle College students.',
            'Preparing teams for participation in friendly and competitive Handball matches, leagues and tournaments organised both locally and abroad.',
            'Organising any other activity that is conducive to the development and promotion of the game of Handball.',
          ]),
        ),
      },
    ],
  },
  {
    title: 'Membership',
    slug: 'membership',
    seoTitle: 'Membership 2026/2027 | La Salle Handball',
    seoDescription:
      'Become a La Salle Handball member for 2026/2027 — support the club and enjoy discounts with over 25 partners across Malta.',
    layout: [
      { blockType: 'pageHeader', variant: 'inner', pageName: 'Membership 2026/2027' },
      {
        blockType: 'richText',
        width: 'prose',
        content: richText(
          p(
            'Support La Salle Handball Club and become a member for the 2026/2027 season. Every membership helps fund our teams, from the nursery to the senior squads — and comes with a membership card that unlocks discounts with our partners across Malta.',
          ),
          h('h2', 'Choose your membership'),
          ul([
            'Membership — €25',
            'Membership with Merchandise — €30, includes a club T-shirt',
            'Couple Membership — €40, two members',
            'Couple Membership with Merchandise — €50, two members and two club T-shirts',
          ]),
          p(
            'We ask for each member’s name and mobile number so we can get your membership card to you and keep you updated on club events.',
          ),
          h('h2', 'Partner discounts'),
          p('Show your membership card to enjoy these offers:'),
          ...Object.entries(PARTNER_DISCOUNTS).flatMap(([category, offers]) => [h('h3', category), ul(offers)]),
        ),
      },
      {
        blockType: 'joinUs',
        heading: 'Become a member today',
        body: 'Pick your membership in the club shop and pay securely online.',
        ctaLabel: 'Get your membership',
        ctaLink: '/shop',
      },
    ],
  },
]

export type SeedPageResult = {
  slug: string
  title: string
  action: 'created' | 'drafted' | 'error'
  detail?: string
}

/**
 * Writes every seed page as a draft. A page that doesn't exist yet is created
 * unpublished; one that does gets a new draft version on top, leaving what is
 * live untouched. Either way nothing reaches the site until someone publishes
 * it from the admin. Only the pages collection is written to.
 */
export const seedPages = async (payload: Payload): Promise<SeedPageResult[]> => {
  const results: SeedPageResult[] = []

  for (const page of SEED_PAGES) {
    try {
      const { docs } = await payload.find({
        collection: 'pages',
        where: { slug: { equals: page.slug } },
        draft: true,
        limit: 1,
        depth: 0,
      })

      if (docs[0]) {
        await payload.update({
          collection: 'pages',
          id: docs[0].id,
          data: { ...page, _status: 'draft' },
          draft: true,
        })
        results.push({ slug: page.slug, title: page.title, action: 'drafted' })
      } else {
        await payload.create({
          collection: 'pages',
          data: { ...page, _status: 'draft' },
          draft: true,
        })
        results.push({ slug: page.slug, title: page.title, action: 'created' })
      }
    } catch (err) {
      payload.logger.error({ msg: `Seeding page "${page.slug}" failed`, err })
      results.push({
        slug: page.slug,
        title: page.title,
        action: 'error',
        detail: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return results
}
