import type { Block } from 'payload'

export const StandingsBlock: Block = {
  slug: 'standings',
  interfaceName: 'StandingsBlock',
  labels: {
    singular: 'Standings Table',
    plural: 'Standings Tables',
  },
  fields: [
    { name: 'showTitle', type: 'checkbox', defaultValue: true },
    { name: 'title', type: 'text' },
    {
      name: 'competition',
      type: 'relationship',
      relationTo: 'competitions',
      required: true,
    },
  ],
}
