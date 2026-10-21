import type { Block } from 'payload'
import { AD_FORMATS } from '@/collections/Advertisements'

export const AdvertisementBlock: Block = {
  slug: 'advertisement',
  interfaceName: 'AdvertisementBlock',
  labels: {
    singular: 'Advertisement',
    plural: 'Advertisements',
  },
  admin: {
    images: {
      thumbnail: { url: '/blocks/adslot.webp', alt: 'An ad sold by the club across the page' },
    },
  },
  fields: [
    {
      name: 'source',
      label: 'Which ads',
      type: 'radio',
      defaultValue: 'rotate',
      options: [
        { label: 'Any running ad of a format', value: 'rotate' },
        { label: 'Chosen ads', value: 'chosen' },
      ],
      admin: {
        layout: 'horizontal',
        description: 'Each visit shows one of the matching ads at random. Ads outside their dates or switched off are skipped, and the block disappears when none are left.',
      },
    },
    {
      name: 'format',
      type: 'select',
      defaultValue: 'banner',
      options: [...AD_FORMATS],
      admin: { condition: (_, siblingData) => siblingData?.source !== 'chosen' },
    },
    {
      name: 'ads',
      type: 'relationship',
      relationTo: 'advertisements',
      hasMany: true,
      admin: { condition: (_, siblingData) => siblingData?.source === 'chosen' },
    },
  ],
}
