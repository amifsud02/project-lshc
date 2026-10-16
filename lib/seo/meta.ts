import type { Metadata } from 'next'
import type { Media } from '@/payload-types'

/** The `meta` group the Payload SEO plugin adds to news, galleries, videos and products. */
export type SeoMeta = {
  title?: string | null
  description?: string | null
  image?: string | Media | null
}

export const mediaUrl = (m: string | Media | null | undefined): string | undefined => {
  if (!m || typeof m === 'string') return undefined
  return m.url ?? undefined
}

/**
 * The title for <title> and social cards. An editor's SEO title is used as written (it already
 * carries the site name the plugin's generator adds); otherwise the layout's "%s | Site" template
 * is applied to the fallback.
 */
export const seoTitle = (meta: SeoMeta | null | undefined, fallback: string): Metadata['title'] =>
  meta?.title ? { absolute: meta.title } : fallback

/** Plain text of `seoTitle`, for Open Graph and structured data. */
export const seoTitleText = (meta: SeoMeta | null | undefined, fallback: string): string =>
  meta?.title || fallback

export const seoDescription = (
  meta: SeoMeta | null | undefined,
  fallback?: string | null,
): string | undefined => meta?.description || fallback || undefined

/** The SEO image when an editor chose one, else the fallback. */
export const seoImage = (
  meta: SeoMeta | null | undefined,
  fallback?: string | Media | null,
): string | undefined => mediaUrl(meta?.image) ?? (typeof fallback === 'string' ? fallback : mediaUrl(fallback))

/** Trims to a search-result friendly length on a word boundary. */
export const truncate = (text: string, max = 160): string => {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max - 20))}…`
}
