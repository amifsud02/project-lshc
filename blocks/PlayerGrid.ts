import type { Block } from 'payload'

export const PlayerGridBlock: Block = {
  slug: 'playerGrid',
  interfaceName: 'PlayerGridBlock',
  labels: {
    singular: 'Player Grid',
    plural: 'Player Grids',
  },
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'team',
      type: 'relationship',
      relationTo: 'teams',
      required: true,
    },
    {
      name: 'position',
      type: 'select',
      defaultValue: 'all',
      options: [
        { label: 'All positions', value: 'all' },
        { label: 'Goalkeeper', value: 'Goalkeeper' },
        { label: 'Line Player', value: 'LinePlayer' },
        { label: 'Winger', value: 'Winger' },
        { label: 'Play Maker', value: 'PlayMaker' },
        { label: 'Lateral', value: 'Lateral' },
        { label: 'Coach', value: 'Coach' },
      ],
    },
  ],
}
