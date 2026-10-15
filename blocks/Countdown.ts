import type { Block } from 'payload'

export const CountdownBlock: Block = {
  slug: 'countdown',
  interfaceName: 'CountdownBlock',
  labels: {
    singular: 'Countdown',
    plural: 'Countdowns',
  },
  admin: {
    images: {
      thumbnail: { url: '/blocks/countdown.webp', alt: 'Heading over a days, hours, minutes and seconds countdown on a dark band' },
    },
  },
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'targetDate',
      type: 'date',
      required: true,
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
  ],
}
