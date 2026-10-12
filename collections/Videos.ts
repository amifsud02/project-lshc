import { slugField, type CollectionConfig } from 'payload'
import { collectionWriteAccess, publishedOrStaff } from '@/lib/auth/roles'
import { VIDEO_CATEGORIES } from '@/lib/data/videoCategories'

/** Accepts a bare ID or any common YouTube URL and stores just the 11-character ID. */
export function parseYouTubeId(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed
  const match = trimmed.match(/(?:youtu\.be\/|v=|embed\/|shorts\/|live\/)([\w-]{11})/)
  return match?.[1] ?? trimmed
}

export const Videos: CollectionConfig = {
  slug: 'videos',
  labels: {
    singular: 'Video',
    plural: 'Videos',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'team', 'publishedAt', '_status'],
    group: 'News and Posts',
    livePreview: {
      url: ({ data }) => {
        const base = process.env.NEXT_PUBLIC_SITE_URL ?? ''
        return data?.slug ? `${base}/tv/${data.slug}` : null
      },
    },
  },
  access: {
    create: collectionWriteAccess('videos'),
    delete: collectionWriteAccess('videos'),
    read: publishedOrStaff,
    update: collectionWriteAccess('videos'),
  },
  versions: {
    drafts: true,
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
      name: 'source',
      type: 'radio',
      required: true,
      defaultValue: 'youtube',
      options: [
        { label: 'YouTube link', value: 'youtube' },
        { label: 'Uploaded file', value: 'upload' },
      ],
      admin: {
        layout: 'horizontal',
        description: 'Use YouTube for full matches and long videos; upload short clips directly.',
      },
    },
    {
      name: 'youtubeId',
      label: 'YouTube video',
      type: 'text',
      admin: {
        condition: (_, siblingData) => siblingData?.source !== 'upload',
        description: 'Paste the YouTube link or the video ID.',
      },
      hooks: {
        beforeValidate: [({ value }) => parseYouTubeId(value)],
      },
      validate: (value: unknown, { siblingData }: { siblingData: { source?: string } }) =>
        siblingData?.source === 'upload' || Boolean(value) || 'Add a YouTube link.',
    },
    {
      name: 'videoFile',
      label: 'Video file',
      type: 'upload',
      relationTo: 'media',
      filterOptions: { mimeType: { like: 'video/' } },
      admin: {
        condition: (_, siblingData) => siblingData?.source === 'upload',
        description: 'Upload an MP4 or pick one from Media (the “TV” folder keeps them tidy).',
      },
      validate: (value: unknown, { siblingData }: { siblingData: { source?: string } }) =>
        siblingData?.source !== 'upload' || Boolean(value) || 'Choose a video file.',
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      index: true,
      options: VIDEO_CATEGORIES.map(({ label, value }) => ({ label, value })),
      admin: { position: 'sidebar' },
    },
    {
      name: 'team',
      type: 'relationship',
      relationTo: 'teams',
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Groups the video under this team’s channel on /tv.',
      },
    },
    {
      name: 'season',
      type: 'text',
      index: true,
      admin: {
        position: 'sidebar',
        description: 'e.g. 2026/27. Used for the season archive.',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      required: true,
      index: true,
      defaultValue: () => new Date().toISOString(),
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Show in the hero at the top of /tv. The newest featured video wins.',
      },
    },
    {
      name: 'duration',
      type: 'text',
      admin: { description: 'Optional, e.g. 4:32.' },
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'thumbnail',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Optional. Falls back to the YouTube thumbnail or a frame from the uploaded video.' },
    },
  ],
}
