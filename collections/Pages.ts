import { PageLayoutBlocks } from '@/blocks'
import { slugField, type CollectionConfig } from 'payload'
import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import { canEditCollection, collectionWriteAccess, publishedOrStaff } from '@/lib/auth/roles'
import { seedPages } from '@/lib/seed/pages'

/** Like Payload's slugify, but keeps "/" so a page can sit under a section, e.g. club/history. */
const slugifyPath = ({ valueToSlugify }: { valueToSlugify?: unknown }) =>
  typeof valueToSlugify === 'string'
    ? valueToSlugify
        .split('/')
        .map((part) =>
          part
            .normalize('NFKD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, ''),
        )
        .filter(Boolean)
        .join('/') || undefined
    : undefined

const previewUrl = (slug?: string) =>
  `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/api/preview?path=${encodeURIComponent(
    `/${slug === 'home' ? '' : (slug ?? '')}`,
  )}`

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
    components: {
      beforeListTable: ['@/components/admin/SeedPages#SeedPages'],
    },
    // Both go through /api/preview so the site renders the latest draft, which
    // matters for pages that have never been published.
    livePreview: {
      url: ({ data }) => previewUrl(data?.slug),
    },
    preview: (doc) => previewUrl(doc?.slug as string | undefined),
  },
  access: {
    create: collectionWriteAccess('pages'),
    delete: collectionWriteAccess('pages'),
    read: publishedOrStaff,
    update: collectionWriteAccess('pages'),
  },
  endpoints: [
    {
      /**
       * POST /api/pages/seed — writes the starter page content as drafts for
       * review. Only the pages collection is touched; nothing goes live until
       * each page is published from the admin. `?missingOnly=1` only creates
       * pages that don't exist yet.
       */
      path: '/seed',
      method: 'post',
      handler: async (req) => {
        if (!canEditCollection('pages', req.user)) {
          return Response.json({ error: 'Forbidden' }, { status: 403 })
        }
        const missingOnly = req.searchParams.get('missingOnly') === '1'
        const results = await seedPages(req.payload, { missingOnly })
        return Response.json({ results })
      },
    },
  ],
  versions: {
    drafts: {
      autosave: { interval: 2000 },
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    slugField({
      name: 'slug',
      required: true,
      position: 'sidebar',
      useAsSlug: 'title',
      slugify: slugifyPath,
      overrides: (field) => {
        const slug = field.fields.find((f) => f.type === 'text' && f.name === 'slug')
        if (slug?.type === 'text') {
          slug.admin = { ...slug.admin, description: 'The page address. Use "/" for a page under a section, e.g. club/history.' }
        }
        return field
      },
    }),
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Layout',
          fields: [
            {
              name: 'layout',
              type: 'blocks',
              minRows: 1,
              blocks: PageLayoutBlocks,
            },
          ],
        },
        {
          label: 'SEO',
          // The SEO plugin's fields, kept under the names pages already store their SEO in.
          fields: [
            OverviewField({
              titlePath: 'seoTitle',
              descriptionPath: 'seoDescription',
              imagePath: 'seoImage',
            }),
            MetaTitleField({
              hasGenerateFn: true,
              overrides: { name: 'seoTitle', label: 'Meta title', localized: false },
            }),
            MetaDescriptionField({
              overrides: { name: 'seoDescription', label: 'Meta description', localized: false },
            }),
            MetaImageField({
              relationTo: 'media',
              overrides: { name: 'seoImage', label: 'Share image', localized: false },
            }),
            PreviewField({
              hasGenerateFn: true,
              titlePath: 'seoTitle',
              descriptionPath: 'seoDescription',
            }),
            {
              name: 'noIndex',
              type: 'checkbox',
              defaultValue: false,
              admin: { description: 'Hide this page from search engines and the sitemap.' },
            },
          ],
        },
      ],
    },
  ],
}
