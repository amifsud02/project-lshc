// Schema.org JSON-LD builders. Rendered with <JsonLd>, they tell search engines and AI
// assistants what each page is about: the club, its articles, matches and videos.
import { absoluteUrl, CLUB_LEGAL_NAME, SITE_URL } from './site'

type Thing = Record<string, unknown>

export const ORGANIZATION_ID = `${SITE_URL}/#organization`
export const WEBSITE_ID = `${SITE_URL}/#website`

/** Drops empty values so the output only carries what is known. */
const compact = <T extends Thing>(obj: T): T =>
  Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0)),
  ) as T

export function organizationJsonLd(site: {
  name: string
  description?: string
  logoUrl?: string
  email?: string
  phone?: string
  sameAs?: (string | undefined)[]
}): Thing {
  return compact({
    '@context': 'https://schema.org',
    '@type': 'SportsOrganization',
    '@id': ORGANIZATION_ID,
    name: CLUB_LEGAL_NAME,
    alternateName: site.name !== CLUB_LEGAL_NAME ? site.name : undefined,
    url: SITE_URL,
    logo: absoluteUrl(site.logoUrl || '/lshc.png'),
    description: site.description,
    sport: 'Handball',
    email: site.email,
    telephone: site.phone,
    address: { '@type': 'PostalAddress', addressCountry: 'MT' },
    areaServed: { '@type': 'Country', name: 'Malta' },
    sameAs: (site.sameAs ?? []).filter(Boolean),
  })
}

export function websiteJsonLd(site: { name: string; description?: string }): Thing {
  return compact({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: site.name,
    url: SITE_URL,
    description: site.description,
    inLanguage: 'en-MT',
    publisher: { '@id': ORGANIZATION_ID },
  })
}

/** A breadcrumb trail, Home first. Each crumb is [name, path]; the last is the current page. */
export function breadcrumbJsonLd(crumbs: [name: string, path: string][]): Thing {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [['Home', '/'] as [string, string], ...crumbs].map(([name, path], i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      item: absoluteUrl(path),
    })),
  }
}

export function newsArticleJsonLd(article: {
  path: string
  headline: string
  description?: string
  image?: string
  datePublished: string
  dateModified?: string
  section?: string
  keywords?: string[]
}): Thing {
  const url = absoluteUrl(article.path)
  return compact({
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    '@id': `${url}#article`,
    mainEntityOfPage: url,
    url,
    // Google truncates headlines past 110 characters.
    headline: article.headline.slice(0, 110),
    description: article.description,
    image: article.image ? [absoluteUrl(article.image)] : undefined,
    datePublished: article.datePublished,
    dateModified: article.dateModified ?? article.datePublished,
    articleSection: article.section,
    keywords: article.keywords?.length ? article.keywords.join(', ') : undefined,
    inLanguage: 'en-MT',
    author: { '@type': 'Organization', '@id': ORGANIZATION_ID, name: CLUB_LEGAL_NAME, url: SITE_URL },
    publisher: { '@id': ORGANIZATION_ID },
    isPartOf: { '@id': WEBSITE_ID },
  })
}

export function sportsEventJsonLd(match: {
  path: string
  name: string
  description?: string
  startDate: string
  venue?: string
  homeTeam: string
  awayTeam: string
  competition?: string
  image?: string
}): Thing {
  const url = absoluteUrl(match.path)
  const team = (name: string) => ({ '@type': 'SportsTeam', name, sport: 'Handball' })
  return compact({
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    '@id': `${url}#event`,
    url,
    name: match.name,
    description: match.description,
    sport: 'Handball',
    startDate: match.startDate,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: compact({
      '@type': 'Place',
      name: match.venue ?? 'Malta',
      address: { '@type': 'PostalAddress', addressCountry: 'MT' },
    }),
    homeTeam: team(match.homeTeam),
    awayTeam: team(match.awayTeam),
    competitor: [team(match.homeTeam), team(match.awayTeam)],
    superEvent: match.competition ? { '@type': 'SportsEvent', name: match.competition } : undefined,
    image: match.image ? [absoluteUrl(match.image)] : undefined,
    organizer: { '@id': ORGANIZATION_ID },
  })
}

export function videoJsonLd(video: {
  path: string
  name: string
  description: string
  thumbnailUrl?: string
  uploadDate: string
  /** ISO 8601 duration, e.g. "PT4M32S". */
  duration?: string
  contentUrl?: string
  embedUrl?: string
}): Thing {
  const url = absoluteUrl(video.path)
  return compact({
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    '@id': `${url}#video`,
    url,
    name: video.name,
    description: video.description,
    thumbnailUrl: video.thumbnailUrl ? [absoluteUrl(video.thumbnailUrl)] : undefined,
    uploadDate: video.uploadDate,
    duration: video.duration,
    contentUrl: video.contentUrl,
    embedUrl: video.embedUrl,
    publisher: { '@id': ORGANIZATION_ID },
  })
}

/** "4:32" or "1:02:03" → "PT4M32S" / "PT1H2M3S". Anything else → undefined. */
export function isoDuration(text?: string | null): string | undefined {
  if (!text || !/^\d+(:\d{1,2}){1,2}$/.test(text.trim())) return undefined
  const parts = text.trim().split(':').map(Number)
  const [h, m, s] = parts.length === 3 ? parts : [0, ...parts]
  return `PT${h ? `${h}H` : ''}${m ? `${m}M` : ''}${s || (!h && !m) ? `${s}S` : ''}`
}

export function productJsonLd(product: {
  path: string
  name: string
  description?: string
  image?: string
  /** In cents. */
  price: number
  currency: string
  inStock: boolean
}): Thing {
  const url = absoluteUrl(product.path)
  return compact({
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#product`,
    url,
    name: product.name,
    description: product.description,
    image: product.image ? [absoluteUrl(product.image)] : undefined,
    brand: { '@type': 'Brand', name: CLUB_LEGAL_NAME },
    offers: {
      '@type': 'Offer',
      url,
      price: (product.price / 100).toFixed(2),
      priceCurrency: product.currency,
      availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@id': ORGANIZATION_ID },
    },
  })
}
