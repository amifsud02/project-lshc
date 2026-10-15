import type { Block } from 'payload'

export const PartnersBlock: Block = {
  slug: 'partners',
  interfaceName: 'PartnersBlock',
  labels: {
    singular: 'Partners Strip',
    plural: 'Partners Strips',
  },
  admin: {
    images: {
      thumbnail: { url: '/blocks/partners.webp', alt: 'Row of partner logos under an Our Partners heading' },
    },
  },
  fields: [
    { name: 'heading', type: 'text', defaultValue: 'Our Partners' },
    {
      name: 'partners',
      type: 'array',
      minRows: 1,
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        { name: 'link', type: 'text' },
      ],
    },
  ],
}
