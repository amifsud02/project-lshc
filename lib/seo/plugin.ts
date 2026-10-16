import { seoPlugin } from '@payloadcms/plugin-seo'
import type { CollectionSlug, PayloadRequest } from 'payload'
import { absoluteUrl, DEFAULT_SITE_NAME, paths } from './site'
import { truncate } from './meta'

/** Collections that get the plugin's `meta` group (Pages place the same fields in their SEO tab). */
export const SEO_COLLECTIONS = ['news', 'galleries', 'videos', 'products'] as const

type Doc = Record<string, any>

const idOf = (value: unknown): string | number | undefined => {
  if (!value) return undefined
  if (typeof value === 'object') return (value as { id?: string | number }).id
  return value as string | number
}

const siteName = async (req: PayloadRequest): Promise<string> => {
  const general = await req.payload.findGlobal({ slug: 'general', depth: 0, req }).catch(() => null)
  return (general as Doc | null)?.general?.name || DEFAULT_SITE_NAME
}

const relatedSlug = async (
  req: PayloadRequest,
  collection: CollectionSlug,
  value: unknown,
): Promise<string | undefined> => {
  if (value && typeof value === 'object' && 'slug' in value) return (value as { slug?: string }).slug
  const id = idOf(value)
  if (!id) return undefined
  const doc = await req.payload.findByID({ collection, id, depth: 0, req }).catch(() => null)
  return (doc as Doc | null)?.slug ?? undefined
}

/** Plain text of a Lexical rich text value, for descriptions. */
const lexicalText = (node: any): string => {
  if (!node) return ''
  if (typeof node.text === 'string') return node.text
  const children: any[] = node.root?.children ?? node.children ?? []
  return children.map(lexicalText).join(node.root ? '\n' : ' ')
}

export const seo = seoPlugin({
  collections: [...SEO_COLLECTIONS],
  uploadsCollection: 'media',
  // Titles are used as written on the site, so the generated one includes the site name.
  generateTitle: async ({ doc, req }) => {
    const title = (doc as Doc)?.title
    return title ? `${title} | ${await siteName(req)}` : ''
  },
  generateDescription: ({ doc }) => {
    const d = doc as Doc
    const text = typeof d?.description === 'string' ? d.description : lexicalText(d?.description)
    return text ? truncate(text, 160) : ''
  },
  generateImage: ({ doc, collectionSlug }) => {
    const d = doc as Doc
    const image =
      collectionSlug === 'news'
        ? d.featuredImage
        : collectionSlug === 'galleries'
          ? d.coverImage
          : collectionSlug === 'videos'
            ? d.thumbnail
            : collectionSlug === 'products'
              ? d.image
              : collectionSlug === 'pages'
                ? d.seoImage
                : undefined
    return (idOf(image) as string) ?? ''
  },
  generateURL: async ({ doc, collectionSlug, req }) => {
    const d = doc as Doc
    if (!d?.slug) return ''
    switch (collectionSlug) {
      case 'pages':
        return absoluteUrl(paths.page(d.slug))
      case 'news': {
        const category = await relatedSlug(req, 'news-categories', d.category)
        return category ? absoluteUrl(paths.news({ slug: d.slug, category: { slug: category } })!) : ''
      }
      case 'galleries': {
        const tag = await relatedSlug(req, 'gallery-categories', d.tag)
        return tag ? absoluteUrl(paths.gallery({ slug: d.slug, tag: { slug: tag } })!) : ''
      }
      case 'videos':
        return absoluteUrl(paths.video(d.slug))
      case 'products':
        return absoluteUrl(paths.product(d.slug))
      default:
        return ''
    }
  },
})
