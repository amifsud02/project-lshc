import type { Block } from 'payload'

export const StepsBlock: Block = {
  slug: 'steps',
  interfaceName: 'StepsBlock',
  labels: { singular: 'Steps', plural: 'Steps' },
  fields: [
    { name: 'heading', type: 'text', required: true, defaultValue: 'How to join' },
    { name: 'intro', type: 'textarea' },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 2,
      maxRows: 6,
      labels: { singular: 'Step', plural: 'Steps' },
      admin: { description: 'Shown numbered, in order.' },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'body', type: 'textarea', required: true },
        {
          type: 'row',
          fields: [
            { name: 'linkLabel', type: 'text', admin: { width: '50%' } },
            { name: 'linkUrl', type: 'text', admin: { width: '50%', description: 'e.g. /academy' } },
          ],
        },
      ],
    },
  ],
}
