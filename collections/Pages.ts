import { PageLayoutBlocks } from '@/blocks'
import { slugField, type CollectionConfig } from 'payload'
import { canEditCollection, collectionWriteAccess, publishedOrStaff } from '@/lib/auth/roles'
import { seedPages } from '@/lib/seed/pages'

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
       * each page is published from the admin.
       */
      path: '/seed',
      method: 'post',
      handler: async (req) => {
        if (!canEditCollection('pages', req.user)) {
          return Response.json({ error: 'Forbidden' }, { status: 403 })
        }
        const results = await seedPages(req.payload)
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
          fields: [
            { name: 'seoTitle', type: 'text' },
            { name: 'seoDescription', type: 'textarea' },
            { name: 'seoImage', type: 'upload', relationTo: 'media' },
            { name: 'noIndex', type: 'checkbox', defaultValue: false },
          ],
        },
      ],
    },
  ],
}
