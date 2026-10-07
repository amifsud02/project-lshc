import React from 'react'

import { notFound } from 'next/navigation'

import { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { unstable_cache } from 'next/cache'
import { fetchPage } from '@/app/_data/fetchPage'
import { fetchPages } from '@/app/_data/fetchPages'
import { Media } from '@/payload-types'
import BlockRenderer from '@/components/BlockRenderer/BlockRenderer'
import SiteFooter from '@/components/Site/SiteFooter'

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

export async function generateMetadata({
  params: paramsPromise,
}: {
  params: Promise<{ slug: string[]; domain: string }>
}): Promise<Metadata> {
  const params = await paramsPromise
  const { slug } = params

  const { isEnabled: draft } = await draftMode()
  const page = await fetchPage(params)

  let ogImage: Media | null = null

  // if (page && page.meta?.image && typeof page.meta.image !== 'string') {
  //   ogImage = page.meta.image
  // }

  // // check if noIndex is true
  const noIndexMeta = page?.noIndex ? { robots: 'noindex' } : {}

  return {
    description: page?.seoDescription,
    // openGraph: mergeOpenGraph({
    //   description: page?.meta?.description ?? undefined,
    //   images: ogImage
    //     ? [
    //         {
    //           url: ogImage.url as string,
    //         },
    //       ]
    //     : undefined,
    //   title: page?.meta?.title || 'BASC',
    //   url: Array.isArray(slug) ? slug.join('/') : '/',
    // }),
    title: page?.seoTitle,
    ...noIndexMeta
  }
}
