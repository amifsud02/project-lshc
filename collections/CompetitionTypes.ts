import type { CollectionConfig } from 'payload'

export const CompetitionTypes: CollectionConfig = {
  slug: 'competitionTypes',
  labels: {
    singular: 'Competition Type',
    plural: 'Competition Types',
  },
  admin: {
    useAsTitle: 'competitionTypeName',
    defaultColumns: ['competitionTypeName', 'updatedAt'],
    group: 'Handball Management',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'competitionTypeName',
      type: 'text',
      required: true,
    },
  ],
}
