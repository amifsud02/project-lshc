import type { Block } from 'payload'

export const StandingsBlock: Block = {
  slug: 'standings',
  interfaceName: 'StandingsBlock',
  labels: {
    singular: 'Standings Table',
    plural: 'Standings Tables',
  },
  admin: {
    images: {
      thumbnail: { url: '/blocks/standings.webp', alt: 'League table with position, team, games, wins, draws, losses, goal difference and points' },
    },
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
