import type { Block } from 'payload'

export const StatsBlock: Block = {
  slug: 'stats',
  interfaceName: 'StatsBlock',
  labels: { singular: 'Stats', plural: 'Stats' },
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 2,
      maxRows: 4,
      labels: { singular: 'Figure', plural: 'Figures' },
      admin: { description: 'Two to four facts, e.g. "1998" / "Founded at De La Salle College". Only use figures you can stand behind.' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'value', type: 'text', required: true, admin: { width: '35%', description: 'e.g. 1998, 5–16, 6' } },
            { name: 'label', type: 'text', required: true, admin: { width: '65%' } },
          ],
        },
      ],
    },
  ],
}
