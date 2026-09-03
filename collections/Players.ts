import type { CollectionConfig } from 'payload'
import { collectionWriteAccess } from '@/lib/auth/roles'

export const Players: CollectionConfig = {
  slug: 'players',
  labels: {
    singular: 'Player',
    plural: 'Players',
  },
  admin: {
    defaultColumns: ['fullName', 'number', 'position', 'team', 'updatedAt'],
    listSearchableFields: ['firstName', 'lastName'],
    group: 'Handball Management',
  },
  access: {
    create: collectionWriteAccess('players'),
    delete: collectionWriteAccess('players'),
    read: () => true,
    update: collectionWriteAccess('players'),
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'firstName', type: 'text', required: true, admin: { width: '50%' } },
        { name: 'lastName', type: 'text', required: true, admin: { width: '50%' } },
      ],
    },
    {
      name: 'fullName',
      type: 'text',
      virtual: true,
      admin: { hidden: true, readOnly: true },
      hooks: {
        afterRead: [
          ({ siblingData }) => {
            const first = (siblingData?.firstName as string | undefined) ?? ''
            const last = (siblingData?.lastName as string | undefined) ?? ''
            return `${first} ${last}`.trim()
          },
        ],
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'number',
          type: 'number',
          min: 0,
          max: 99,
          admin: { width: '30%' },
        },
        {
          name: 'position',
          type: 'select',
          required: true,
          admin: { width: '70%' },
          options: [
            { label: 'Goalkeeper', value: 'Goalkeeper' },
            { label: 'Line Player', value: 'LinePlayer' },
            { label: 'Winger', value: 'Winger' },
            { label: 'Play Maker', value: 'PlayMaker' },
            { label: 'Lateral', value: 'Lateral' },
            { label: 'Coach', value: 'Coach' },
          ],
        },
      ],
    },
    {
      name: 'team',
      type: 'relationship',
      relationTo: 'teams',
      required: true,
      index: true,
    },
    {
      name: 'profilePicture',
      type: 'upload',
      relationTo: 'media',
    },
  ],
}
