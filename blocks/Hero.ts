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
      name: 'variant',
      type: 'select',
      defaultValue: 'v1',
      options: [
        { label: 'Classic (Hero)', value: 'v1' },
        { label: 'Modern (HeroV2)', value: 'v2' },
      ],
    },
    {
      name: 'slides',
      type: 'array',
      admin: {
        description: 'Only used by the Classic variant. Leave empty to fall back to component defaults.',
        condition: (_, siblingData) => siblingData?.variant === 'v1',
      },
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        { name: 'caption', type: 'text' },
      ],
    },
  ],
}
