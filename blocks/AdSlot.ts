import type { Block } from 'payload'

export const AdSlotBlock: Block = {
  slug: 'adSlot',
  interfaceName: 'AdSlotBlock',
  labels: {
    singular: 'Ad Slot',
    plural: 'Ad Slots',
  },
  admin: {
    images: {
      thumbnail: { url: '/blocks/adslot.webp', alt: 'A reserved Google AdSense unit across the page' },
    },
  },
  fields: [
    {
      name: 'adSlot',
      type: 'text',
      required: true,
      admin: { description: 'Google AdSense slot ID.' },
    },
    {
      name: 'format',
      type: 'select',
      defaultValue: 'auto',
      options: [
        { label: 'Auto', value: 'auto' },
        { label: 'Horizontal', value: 'horizontal' },
        { label: 'Vertical', value: 'vertical' },
        { label: 'Rectangle', value: 'rectangle' },
        { label: 'In-article (fluid)', value: 'fluid' },
      ],
    },
  ],
}
