import { listNews, listUpcomingFixtures } from '@/lib/seo/content'
import { seoDescription } from '@/lib/seo/meta'
import { absoluteUrl, CLUB_LEGAL_NAME, DEFAULT_SITE_NAME, paths } from '@/lib/seo/site'
import { getFooterGlobal, getGeneralGlobal } from '@/lib/utils/payload/globals'

export const revalidate = 3600

const maltaDate = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Malta',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))

const link = (title: string, path: string, note?: string) =>
  `- [${title.replace(/[[\]]/g, '')}](${absoluteUrl(path)})${note ? `: ${note.replace(/\s+/g, ' ').trim()}` : ''}`

/**
 * /llms.txt (https://llmstxt.org): a plain-language guide to the site for AI assistants and
 * answer engines, so they describe the club accurately and link to the right pages.
 */
export async function GET() {
  const [general, footer, news, fixtures] = await Promise.all([
    getGeneralGlobal().catch(() => null),
    getFooterGlobal().catch(() => null),
    listNews(15),
    listUpcomingFixtures(10),
  ])

  const siteName = general?.siteName || DEFAULT_SITE_NAME
  const description =
    general?.siteDescription ||
    `${CLUB_LEGAL_NAME} is a handball club in Malta with men's, women's, under-21 and youth teams.`

  const contact = [
    footer?.contact.email ? `Email: ${footer.contact.email}` : null,
    footer?.contact.phone ? `Phone: ${footer.contact.phone}` : null,
    ...[footer?.social.facebook, footer?.social.instagram, footer?.social.tiktok].filter(Boolean),
  ].filter(Boolean)

  const lines = [
    `# ${siteName}`,
    '',
    `> ${description.replace(/\s+/g, ' ').trim()}`,
    '',
    `This is the official website of ${CLUB_LEGAL_NAME}, a handball club in Malta. It publishes club news, match reports, fixtures and results, photo galleries, match videos (La Salle TV) and details of the club's nursery for young players.`,
    '',
    '## Club',
    link('Home', '/', 'Latest news, upcoming matches and results'),
    link('Club history', '/club/history'),
    link('Management', '/club/management', 'The committee running the club'),
    link('Sponsors', '/club/sponsors'),
    link('Contact', '/contact', 'How to reach the club'),
    '',
    '## Teams and matches',
    link("Men's first team", '/teams/men-first-team/all'),
    link("Women's first team", '/teams/women-first-team/all'),
    link("Under-21 men's team", '/teams/u21-mens-team/all'),
    link("Under-21 women's team", '/teams/u21-womens-team/all'),
    link('Youth teams', '/teams/youth-teams'),
    link('Fixtures and results', '/fixtures', "Upcoming matches and this season's results for every La Salle team"),
    link(
      'Handball Academy',
      '/academy',
      "The club's academy (nursery) for boys and girls aged 5 to 16: schedule, venues, fees and online registration",
    ),
    '',
    '## News and media',
    link('News', '/news', 'Match reports and club announcements'),
    link('Photo galleries', '/news/gallery'),
    link('La Salle TV', '/tv', 'Match videos and highlights'),
    link('RSS feed', '/news/feed.xml'),
  ]

  if (fixtures.length) {
    lines.push('', '## Upcoming fixtures (Malta time)')
    for (const f of fixtures) {
      lines.push(link(f.title, f.path, `${maltaDate(f.startDate)}${f.venue ? `, ${f.venue}` : ''}`))
    }
  }

  if (news.length) {
    lines.push('', '## Latest news')
    for (const post of news) {
      const path = paths.news(post)
      if (path) lines.push(link(post.title, path, seoDescription(post.meta, post.description)))
    }
  }

  if (contact.length) {
    lines.push('', '## Contact', ...contact.map((c) => `- ${c}`))
  }

  lines.push('', '## Optional', link('Sitemap', '/sitemap.xml', 'Every public page'))

  return new Response(`${lines.join('\n')}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
