// URL helpers shared by metadata, the sitemap, robots.txt, llms.txt and structured data.
// Safe to import anywhere: no Payload or Next server imports.

const FALLBACK_SITE_URL = 'https://lasallehandball.com'

/** The public site origin without a trailing slash, e.g. "https://lasallehandball.com". */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  FALLBACK_SITE_URL
).replace(/\/+$/, '')

export const DEFAULT_SITE_NAME = 'La Salle Handball'
export const CLUB_LEGAL_NAME = 'La Salle Handball Club'

/** "/news" → "https://lasallehandball.com/news". Absolute URLs are returned unchanged. */
export const absoluteUrl = (path = '/'): string => {
  if (/^https?:\/\//i.test(path)) return path
  return `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`
}

type Slugged = { slug?: string | null } | string | null | undefined

const relSlug = (rel: Slugged): string | null =>
  rel && typeof rel === 'object' ? (rel.slug ?? null) : null

/** Public paths for each kind of document, so every caller builds the same URL. */
export const paths = {
  page: (slug?: string | null) => (!slug || slug === 'home' ? '/' : `/${slug}`),
  news: (doc: { slug?: string | null; category?: Slugged }) => {
    const category = relSlug(doc.category)
    return category && doc.slug ? `/news/${category}/${doc.slug}` : null
  },
  newsCategory: (slug: string) => `/news/${slug}`,
  gallery: (doc: { slug?: string | null; tag?: Slugged }) => {
    const tag = relSlug(doc.tag)
    return tag && doc.slug ? `/news/gallery/${tag}/${doc.slug}` : null
  },
  galleryCategory: (slug: string) => `/news/gallery/${slug}`,
  video: (slug: string) => `/tv/${slug}`,
  fixture: (slug: string) => `/fixtures/${slug}`,
  fixtures: '/fixtures',
  player: (slug: string) => `/players/${slug}`,
  product: (slug: string) => `/shop/${slug}`,
}
