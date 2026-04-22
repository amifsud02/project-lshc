import type { CollectionConfig } from 'payload'

export const Competitions: CollectionConfig = {
  slug: 'competitions',
  labels: {
    singular: 'Competition',
    plural: 'Competitions',
  },
  admin: {
    useAsTitle: 'competitionName',
    defaultColumns: ['competitionName', 'season', 'competitionType', 'updatedAt'],
    group: 'Handball Management',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'competitionName',
      type: 'text',
      required: true,
    },
    {
      name: 'season',
      type: 'text',
      required: true,
      index: true,
      admin: { description: 'e.g. "2025/2026"' },
    },
    {
      name: 'competitionType',
      type: 'relationship',
      relationTo: 'competitionTypes',
      required: true,
    },
  ],
}
