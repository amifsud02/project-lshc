import { listNews } from '@/lib/seo/content'
import { mediaUrl, seoDescription } from '@/lib/seo/meta'
import { absoluteUrl, DEFAULT_SITE_NAME, paths } from '@/lib/seo/site'
import { getGeneralGlobal } from '@/lib/utils/payload/globals'

export const revalidate = 3600

const escape = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** RSS 2.0 feed of the latest news, for feed readers, news aggregators and AI crawlers. */
export async function GET() {
  const [general, posts] = await Promise.all([getGeneralGlobal().catch(() => null), listNews(30)])
  const siteName = general?.siteName || DEFAULT_SITE_NAME

  const items = posts.flatMap((post) => {
    const path = paths.news(post)
    if (!path) return []
    const url = absoluteUrl(path)
    const description = seoDescription(post.meta, post.description) ?? ''
    const media = typeof post.featuredImage === 'object' ? post.featuredImage : null
    const image = mediaUrl(media)
    const category = typeof post.category === 'object' ? post.category?.title : undefined
    return [
      [
        '    <item>',
        `      <title>${escape(post.title)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        `      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>`,
        `      <description>${escape(description)}</description>`,
        category ? `      <category>${escape(category)}</category>` : '',
        image
          ? `      <enclosure url="${escape(absoluteUrl(image))}" type="${media?.mimeType || 'image/jpeg'}" length="${media?.filesize ?? 0}" />`
          : '',
        '    </item>',
      ]
        .filter(Boolean)
        .join('\n'),
    ]
  })

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(`${siteName} news`)}</title>
    <link>${absoluteUrl('/news')}</link>
    <description>${escape(general?.siteDescription || `The latest news from ${siteName}.`)}</description>
    <language>en-mt</language>
    <atom:link href="${absoluteUrl('/news/feed.xml')}" rel="self" type="application/rss+xml" />
${items.join('\n')}
  </channel>
</rss>
`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  })
}
