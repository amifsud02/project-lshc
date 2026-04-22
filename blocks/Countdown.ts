import type { Block } from 'payload'

export const CountdownBlock: Block = {
  slug: 'countdown',
  interfaceName: 'CountdownBlock',
  labels: {
    singular: 'Countdown',
    plural: 'Countdowns',
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
