import type { Block } from 'payload'

export const NextMatchBlock: Block = {
  slug: 'nextMatch',
  interfaceName: 'NextMatchBlock',
  labels: { singular: 'Next match', plural: 'Next matches' },
  fields: [
    { name: 'heading', type: 'text', defaultValue: 'Next match' },
    {
      name: 'team',
      type: 'relationship',
      relationTo: 'teams',
      admin: { description: 'Only this team’s next match. Leave empty for the next La Salle match of any team.' },
    },
  ],
}
