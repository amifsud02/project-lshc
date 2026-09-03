import type { CollectionConfig } from 'payload'
import { collectionWriteAccess } from '@/lib/auth/roles'

export const Standings: CollectionConfig = {
  slug: 'standings',
  labels: {
    singular: 'Standing',
    plural: 'Standings',
  },
  admin: {
    useAsTitle: 'standingName',
    defaultColumns: ['standingName', 'competition', 'updatedAt'],
    group: 'Handball Management',
  },
  access: {
    create: collectionWriteAccess('standings'),
    delete: collectionWriteAccess('standings'),
    read: () => true,
    update: collectionWriteAccess('standings'),
  },
  fields: [
    {
      name: 'standingName',
      type: 'text',
      required: true,
    },
    {
      name: 'competition',
      type: 'relationship',
      relationTo: 'competitions',
      required: true,
      index: true,
    },
    {
      name: 'competitionType',
      type: 'relationship',
      relationTo: 'competitionTypes',
    },
    {
      name: 'teams',
      type: 'array',
      minRows: 1,
      labels: { singular: 'Team Row', plural: 'Team Rows' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'position', type: 'number', required: true, min: 1, admin: { width: '20%' } },
            {
              name: 'team',
              type: 'relationship',
              relationTo: 'teams',
              required: true,
              admin: { width: '80%' },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'matchesPlayed', type: 'number', required: true, defaultValue: 0, min: 0, admin: { width: '16%' } },
            { name: 'wins', type: 'number', required: true, defaultValue: 0, min: 0, admin: { width: '16%' } },
            { name: 'draws', type: 'number', required: true, defaultValue: 0, min: 0, admin: { width: '16%' } },
            { name: 'losses', type: 'number', required: true, defaultValue: 0, min: 0, admin: { width: '16%' } },
            { name: 'goalDifference', type: 'number', required: true, defaultValue: 0, admin: { width: '18%' } },
            { name: 'points', type: 'number', required: true, defaultValue: 0, min: 0, admin: { width: '18%' } },
          ],
        },
      ],
    },
  ],
}
