import type { Payload } from 'payload'

import { h, list, para, richText } from './lexical'

/** A post on how to keep up with the club, for searches like "La Salle handball fixtures". */
export const GUIDE_POST = {
  title: 'How to follow La Salle Handball this season',
  slug: 'how-to-follow-la-salle-handball-this-season',
  category: { slug: 'club-news', title: 'Club News' },
  description:
    'Fixtures, results, weekly match reports, La Salle TV and the Handball Academy: everywhere to keep up with La Salle Handball Club this season.',
  tags: ['Guide', 'Fixtures', 'La Salle TV'],
  content: richText(
    para(
      'With teams from the academy up to the men’s and women’s first teams, La Salle plays almost every weekend of the season. Here is where to find everything on this site.',
    ),
    h('h2', 'Fixtures and results'),
    para(
      'The ',
      { link: 'fixtures page', url: '/fixtures' },
      ' lists every La Salle match with its date, time, venue and competition, and filters by team. Each match has its own page, which shows the score and line-ups once it has been played.',
    ),
    h('h2', 'Match reports'),
    para(
      'After each weekend, a round-up of every La Salle result goes up under ',
      { link: 'Match Reports', url: '/news/match-reports' },
      ', with the scores and the standout players. You can follow every post through the ',
      { link: 'RSS feed', url: '/news/feed.xml' },
      '.',
    ),
    h('h2', 'Videos and photos'),
    para(
      { link: 'La Salle TV', url: '/tv' },
      ' has match highlights, interviews and full games, and the ',
      { link: 'photo galleries', url: '/news/gallery' },
      ' cover matches, tournaments and academy sessions.',
    ),
    h('h2', 'Playing for La Salle'),
    para(
      'Boys and girls aged 5 to 16 can join the ',
      { link: 'Handball Academy', url: '/academy' },
      '. Teenagers and adults can find out how to join on the ',
      { link: 'play handball page', url: '/play-handball' },
      ', and anyone new to the sport can start with ',
      { link: 'what handball is and how it’s played', url: '/what-is-handball' },
      '.',
    ),
  ),
}

/**
 * Landing pages written for people searching to play or learn about handball in Malta.
 * Every fact comes from the club's own pages (history, academy, teams, fixtures), the
 * IHF Rules of the Game, or the Malta Handball Association's site; nothing is invented.
 */
export const GUIDE_PAGES = [
  {
    title: 'Play handball in Malta',
    slug: 'play-handball',
    seoTitle: 'Play handball in Malta | La Salle Handball Club',
    seoDescription:
      "Join La Salle Handball Club in Malta: Handball Academy for boys and girls aged 5–16, youth teams, and men's and women's teams. Founded 1998.",
    layout: [
      { blockType: 'pageHeader', variant: 'inner', pageName: 'Play handball with La Salle' },
      {
        blockType: 'mediaText',
        eyebrow: 'Since 1998',
        heading: 'A handball club for every age',
        body: richText(
          para(
            'La Salle Handball Club was founded at De La Salle College in 1998, and started ',
            { bold: "Malta's first handball nursery" },
            ' that same year. Today the club runs a Handball Academy for boys and girls aged 5 to 16, youth teams in the Malta Handball Association’s leagues and cups, and senior men’s and women’s teams.',
          ),
          para(
            'Whether your child is trying a sport for the first time or you want to get back on court, here is how to start. New to the game? Read ',
            { link: 'what handball is and how it’s played', url: '/what-is-handball' },
            '.',
          ),
        ),
      },
      {
        blockType: 'stats',
        items: [
          { value: '1998', label: 'Founded at De La Salle College' },
          { value: '1st', label: 'Handball nursery in Malta' },
          { value: '5–16', label: 'Academy ages, for boys and girls' },
          { value: '4', label: "Men's, women's and under-21 teams" },
        ],
      },
      {
        blockType: 'steps',
        heading: 'How to start',
        items: [
          {
            title: 'Children aged 5 to 16',
            body: 'Join the La Salle Handball Academy. Its page has the training schedule, venues and fees, and you can register online.',
            linkLabel: 'Go to the academy',
            linkUrl: '/academy',
          },
          {
            title: 'Teenagers and adults',
            body: 'Email info@lasallehandball.com with your age and any experience. We’ll tell you which team and session to come to.',
            linkLabel: 'Contact the club',
            linkUrl: '/contact',
          },
          {
            title: 'Come and watch',
            body: 'Every La Salle match is on the fixtures page with its date, time and venue. Highlights and full games are on La Salle TV.',
            linkLabel: 'See the fixtures',
            linkUrl: '/fixtures',
          },
        ],
      },
      { blockType: 'nextMatch', heading: 'Next match' },
      {
        blockType: 'faq',
        heading: 'Questions about joining',
        items: [
          {
            question: 'What age can my child start handball at La Salle?',
            answer:
              'The La Salle Handball Academy takes boys and girls aged 5 to 16. The academy page has the current schedule, venues and fees, and you can register online there.',
          },
          {
            question: 'Does La Salle have women’s and girls’ teams?',
            answer:
              'Yes. La Salle has a women’s first team and an under-21 women’s team, and girls can join the Handball Academy from age 5.',
          },
          {
            question: 'Where can I watch La Salle matches?',
            answer:
              'Every upcoming La Salle match is listed on the fixtures page with its date, time and venue. Match videos and highlights are on La Salle TV.',
          },
          {
            question: 'How do I contact the club?',
            answer: 'Email info@lasallehandball.com or use the form on the contact page.',
          },
        ],
      },
      {
        blockType: 'ctaBanner',
        heading: 'Ready to play?',
        body: 'Children can register for the Handball Academy online. Everyone else, send us an email and we’ll find you a team.',
        primary: { label: 'Register for the academy', url: '/academy' },
        secondary: { label: 'Contact the club', url: '/contact' },
        tone: 'navy',
      },
    ],
  },
  {
    title: 'What is handball?',
    slug: 'what-is-handball',
    seoTitle: 'What is handball? Rules for beginners | La Salle Handball',
    seoDescription:
      'Handball explained for beginners: the teams, the court, the main rules and match length, and how to watch and play handball in Malta.',
    layout: [
      { blockType: 'pageHeader', variant: 'inner', pageName: 'What is handball?' },
      {
        blockType: 'richText',
        width: 'prose',
        content: richText(
          para(
            'Handball is a fast indoor team sport. Two teams pass the ball with their hands and try to throw it into the other team’s goal. It mixes the running of basketball with the shooting of football, and matches are high-scoring: a team often scores 25 goals or more.',
          ),
          h('h2', 'The basics'),
          list([
            [{ bold: 'Teams:' }, ' each team has up to seven players on court, normally six court players and a goalkeeper.'],
            [{ bold: 'The court:' }, ' 40 metres long and 20 metres wide, with a goal 3 metres wide and 2 metres high at each end.'],
            [
              { bold: 'Match length:' },
              ' two halves of 30 minutes for players aged 16 and over, two halves of 25 minutes for ages 12 to 16, and two halves of 20 minutes for ages 8 to 12.',
            ],
            [{ bold: 'Substitutions:' }, ' players can come on and off at any time, as often as the team likes.'],
          ]),
          h('h2', 'The main rules'),
          list([
            [{ bold: 'The goal area:' }, ' only the goalkeeper may stand inside the 6-metre line. Court players can jump into it to shoot, as long as they let go of the ball before landing.'],
            [{ bold: 'Steps and seconds:' }, ' a player holding the ball can take up to three steps and hold it for up to three seconds, then must pass, shoot or bounce it.'],
            [{ bold: 'Contact:' }, ' defenders may block with their body, but not push, hold or hit.'],
            [{ bold: '7-metre throw:' }, ' when a foul stops a clear chance to score, the attacking team gets a shot from 7 metres, one against the goalkeeper.'],
            [{ bold: 'Suspensions:' }, ' serious fouls earn a 2-minute suspension, and the team plays a player short until it ends.'],
            [{ bold: 'Passive play:' }, ' a team that stops trying to attack can be warned, and then lose the ball.'],
          ]),
          para(
            'These are simplified from the ',
            { link: 'IHF Rules of the Game', url: 'https://www.ihf.info/regulations-documents' },
            ', the international rulebook for the sport.',
          ),
          h('h2', 'Handball in Malta'),
          para(
            'Handball in Malta is run by the ',
            { link: 'Malta Handball Association', url: 'https://maltahandball.com' },
            ', founded in 1995, which organises the national leagues and cups for senior and youth teams. La Salle Handball Club has played since 1998, and its men’s, women’s and youth teams take part in the association’s competitions.',
          ),
          h('h2', 'Try it yourself'),
          para(
            'Children aged 5 to 16 can start at the ',
            { link: 'La Salle Handball Academy', url: '/academy' },
            '. Teenagers and adults can find out how to join on the ',
            { link: 'play handball page', url: '/play-handball' },
            ', or come and watch a match first: every game is on the ',
            { link: 'fixtures page', url: '/fixtures' },
            '.',
          ),
        ),
      },
      { blockType: 'latestVideos', heading: 'Watch handball on La Salle TV', limit: 3 },
      {
        blockType: 'ctaBanner',
        heading: 'Want to give it a go?',
        body: 'Children can start at the academy from age 5. Older players can ask the club about joining a team.',
        primary: { label: 'How to join', url: '/play-handball' },
        secondary: { label: 'See the fixtures', url: '/fixtures' },
        tone: 'light',
      },
    ],
  },
]

/**
 * Creates the guide pages that don't exist yet, published. Pages that already exist (live or
 * draft) are never touched, so editors' changes are kept. Only the pages collection is written.
 */
export async function seedGuidePages(payload: Payload): Promise<{ slug: string; action: 'created' | 'skipped' }[]> {
  const results: { slug: string; action: 'created' | 'skipped' }[] = []
  for (const page of GUIDE_PAGES) {
    const { totalDocs } = await payload.find({ collection: 'pages', where: { slug: { equals: page.slug } }, draft: true, limit: 1, depth: 0 })
    if (totalDocs > 0) {
      results.push({ slug: page.slug, action: 'skipped' })
      continue
    }
    await payload.create({ collection: 'pages', data: { ...page, _status: 'published' } as any })
    results.push({ slug: page.slug, action: 'created' })
  }
  return results
}

/**
 * Creates the guide post (and its category) if missing, published, reusing the newest post's
 * featured image. Existing posts are never touched.
 */
export async function seedGuidePost(payload: Payload): Promise<'created' | 'skipped' | 'no-image'> {
  const { totalDocs } = await payload.find({ collection: 'news', where: { slug: { equals: GUIDE_POST.slug } }, draft: true, limit: 1, depth: 0 })
  if (totalDocs > 0) return 'skipped'

  const { docs: latest } = await payload.find({ collection: 'news', sort: '-publishedAt', limit: 1, depth: 0 })
  const image = latest[0]?.featuredImage
  if (!image) return 'no-image'

  const { docs: cats } = await payload.find({ collection: 'news-categories', where: { slug: { equals: GUIDE_POST.category.slug } }, limit: 1 })
  const category =
    cats[0] ?? (await payload.create({ collection: 'news-categories', data: { title: GUIDE_POST.category.title, slug: GUIDE_POST.category.slug, _status: 'published' } as any }))

  await payload.create({
    collection: 'news',
    data: {
      title: GUIDE_POST.title,
      slug: GUIDE_POST.slug,
      category: category.id,
      publishedAt: new Date().toISOString(),
      description: GUIDE_POST.description,
      featuredImage: typeof image === 'object' ? image.id : image,
      tags: GUIDE_POST.tags,
      content: GUIDE_POST.content,
      _status: 'published',
    } as any,
  })
  return 'created'
}
