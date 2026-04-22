import { slugField, type CollectionConfig, type CollectionSlug } from 'payload'

export const Galleries: CollectionConfig = {
  slug: 'galleries',
  labels: {
    singular: 'Gallery',
    plural: 'Galleries',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'tag', 'publishedAt', '_status', 'updatedAt'],
    group: 'Gallery',
    livePreview: {
      url: async ({ data, req }) => {
        const base = process.env.NEXT_PUBLIC_SITE_URL ?? ''
        const slug = data?.slug
        const tag = data?.tag
        if (!slug || !tag) return null

        let tagSlug: string | undefined
        if (typeof tag === 'object' && tag !== null && 'slug' in tag) {
          tagSlug = (tag as { slug?: string }).slug
        } else {
          const doc = await req.payload
            .findByID({ collection: 'gallery-categories', id: tag, depth: 0 })
            .catch(() => null)
          tagSlug = doc?.slug
        }

        if (!tagSlug) return null
        return `${base}/news/gallery/${tagSlug}/${slug}`
      },
    },
  },
  access: {
    read: ({ req: { user } }) => {
      if (user) return true
      return { _status: { equals: 'published' } }
    },
  },
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
      name: 'tag',
      relationTo: 'gallery-categories',
      type: 'relationship',
      required: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Used in the URL: /news/gallery/<tag>/<slug>',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      required: true,
      index: true,
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayOnly' },
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: { description: 'Optional short blurb shown above the gallery.' },
    },
    {
      name: 'folder',
      type: 'relationship',
      relationTo: 'payload-folders' as CollectionSlug,
      required: true,
      admin: {
        description:
          "Pick the Media folder that contains this gallery's images. Manage folders from the Media collection.",
      },
      filterOptions: () => ({
        folderType: { in: ['media'] },
      }),
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'Optional. Used as the gallery hero and on cards. Falls back to the first image in the selected folder.',
      },
    },
  ],
}
