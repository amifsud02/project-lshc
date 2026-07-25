import type { Block } from 'payload'

export const PageHeaderBlock: Block = {
  slug: 'pageHeader',
  interfaceName: 'PageHeaderBlock',
  labels: {
    singular: 'Page Header',
    plural: 'Page Headers',
  },
  fields: [
    {
      name: 'variant',
      type: 'select',
      defaultValue: 'inner',
      required: true,
      options: [
        { label: 'Inner Page', value: 'inner' },
        { label: 'Landing Page', value: 'landing' },
      ],
    },
    {
      name: 'pageName',
      type: 'text',
      admin: {
        condition: (_, sibling) => sibling?.variant !== 'landing',
      },
    },
    {
      name: 'title',
      type: 'text',
      admin: {
        condition: (_, sibling) => sibling?.variant === 'landing',
      },
    },
    {
      name: 'subtitle',
      type: 'text',
      admin: {
        condition: (_, sibling) => sibling?.variant === 'landing',
      },
    },
    {
      name: 'slides',
      type: 'array',
      admin: {
        condition: (_, sibling) => sibling?.variant === 'landing',
        description: 'Leave empty to use component defaults.',
      },
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        { name: 'alt', type: 'text' },
      ],
    },
    {
      name: 'social',
      type: 'group',
      admin: {
        condition: (_, sibling) => sibling?.variant === 'landing',
      },
      fields: [
        { name: 'facebook', type: 'text' },
        { name: 'instagram', type: 'text' },
        { name: 'tiktok', type: 'text' },
      ],
    },
  ],
}
