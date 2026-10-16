import React from 'react'

import { notFound } from 'next/navigation'

import type { Metadata, ResolvingMetadata } from 'next'
import { unstable_cache } from 'next/cache'
import { fetchPage } from '@/app/_data/fetchPage'
import { fetchPages } from '@/app/_data/fetchPages'
import BlockRenderer from '@/components/BlockRenderer/BlockRenderer'
import { siteOpenGraph } from '@/lib/utils/metadata'
import { mediaUrl } from '@/lib/seo/meta'
import { paths } from '@/lib/seo/site'

export const revalidate = 60

export default async function Page({
  params: paramsPromise,
}: {
  params: Promise<{ slug: string[]; domain: string }>
}) {
  const params = await paramsPromise
  const page = await fetchPage(params)

  if (page === null) {
    return notFound()
  }

  const { layout } = page;

  return (
    <>
      <article>
        {/* @ts-ignore */}
        <BlockRenderer blocks={layout}/>
      </article>
    </>
  )
}

export async function generateStaticParams() {
  const getPages = unstable_cache(fetchPages, ['pages'])
  const pages = await getPages();

  return pages.map(({ slug }) => ({
    slug: (slug ?? '').split('/').filter(Boolean),
  }))

  // return pages.map(({ breadcrumbs }) => ({
  //   slug: breadcrumbs?.[breadcrumbs.length - 1]?.url?.replace(/^\/|\/$/g, '').split('/'),
  // }))
}

export async function generateMetadata(
  {
    params: paramsPromise,
  }: {
    params: Promise<{ slug: string[]; domain: string }>
  },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const params = await paramsPromise
  const page = await fetchPage(params)
  if (!page) return {}

  const path = paths.page(page.slug)
  const isHome = path === '/'
  const description = page.seoDescription || undefined
  const image = mediaUrl(page.seoImage)
  // The home page keeps the layout's "Site | Official Website" title unless an SEO title is set.
  const title: Metadata['title'] = page.seoTitle
    ? { absolute: page.seoTitle }
    : isHome
      ? undefined
      : page.title
  const ogTitle = page.seoTitle || (isHome ? undefined : page.title)

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: await siteOpenGraph(parent, {
      ...(ogTitle ? { title: ogTitle } : {}),
      ...(description ? { description } : {}),
      ...(image ? { images: [image] } : {}),
      url: path,
    }),
    ...(page.noIndex ? { robots: { index: false, follow: true } } : {}),
  }
}
