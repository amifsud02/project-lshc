import type { Block } from 'payload'

export const SponsorGridBlock: Block = {
  slug: 'sponsorGrid',
  interfaceName: 'SponsorGridBlock',
  labels: {
    singular: 'Sponsor Grid',
    plural: 'Sponsor Grids',
  },
  fields: [
    { name: 'heading', type: 'text', defaultValue: 'Our Sponsors' },
    {
      name: 'sponsors',
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
