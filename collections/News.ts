import { slugField, type CollectionConfig } from 'payload'
import { collectionWriteAccess, publishedOrStaff } from '@/lib/auth/roles'

export const News: CollectionConfig = {
  slug: 'news',
  labels: {
    singular: 'News',
    plural: 'News',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'publishedAt', '_status', 'updatedAt'],
  },
  access: {
    create: collectionWriteAccess('news'),
    delete: collectionWriteAccess('news'),
    read: publishedOrStaff,
    update: collectionWriteAccess('news'),
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
      name: 'category',
      relationTo: 'news-categories',
      type: 'relationship',
      required: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Used in the URL: /news/<category>/<slug>',
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
      required: true,
      admin: { description: 'Short excerpt shown on cards and in search results.' },
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'tags',
      type: 'text',
      hasMany: true,
      index: true,
    },
    {
      name: 'fixture',
      label: 'Match',
      type: 'relationship',
      relationTo: 'fixtures',
      index: true,
      admin: {
        position: 'sidebar',
        description:
          'For a match preview or report: the post is shown on the match page, and links back to it. Reports written from the MHA match report are linked automatically.',
      },
    },
    {
      name: 'mhaMatchId',
      label: 'MHA match',
      type: 'text',
      index: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
        condition: (data) => Boolean(data?.mhaMatchId),
        description: 'An older one-match report, written automatically from this MHA match report.',
      },
    },
    {
      name: 'mhaMatchIds',
      label: 'MHA matches',
      type: 'text',
      hasMany: true,
      index: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
        condition: (data) => Boolean(data?.mhaMatchIds?.length),
        description:
          'The matches this weekly round-up covers, written automatically from their MHA match reports. Each match is covered once, and the post shows on each match page.',
      },
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
    },
  ],
}
