import type { Block } from 'payload'

export const HeroBlock: Block = {
  slug: 'hero',
  interfaceName: 'HeroBlock',
  labels: {
    singular: 'Hero',
    plural: 'Heroes',
  },
  fields: [
    {
      name: 'title',
      type: 'richText',
      admin: {
        description: 'Hero title. Leave empty to fall back to the default title.',
      },
    },
    {
      name: 'slides',
      type: 'array',
      admin: {
        description: 'Leave empty to fall back to component defaults.',
      },
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        { name: 'caption', type: 'text' },
      ],
    },
  ],
}
