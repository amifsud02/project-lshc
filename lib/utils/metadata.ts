import type { Metadata, ResolvingMetadata } from 'next'

type OpenGraph = NonNullable<Metadata['openGraph']>

/**
 * A page's Open Graph tags plus the site name and share image from Site Settings. Next replaces
 * the layout's openGraph object wholesale when a page sets its own, so pages that set one use this.
 */
export async function siteOpenGraph(parent: ResolvingMetadata, og: OpenGraph): Promise<OpenGraph> {
  const site = (await parent).openGraph
  return { siteName: site?.siteName ?? undefined, images: site?.images, ...og }
}
