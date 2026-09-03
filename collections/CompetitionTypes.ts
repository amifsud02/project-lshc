import type { CollectionConfig } from 'payload'
import { collectionWriteAccess } from '@/lib/auth/roles'

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
    create: collectionWriteAccess('competitionTypes'),
    delete: collectionWriteAccess('competitionTypes'),
    read: () => true,
    update: collectionWriteAccess('competitionTypes'),
  },
  fields: [
    {
      name: 'competitionTypeName',
      type: 'text',
      required: true,
    },
  ],
}
