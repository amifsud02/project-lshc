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
    listSearchableFields: ['firstName', 'lastName', 'mhaPlayerId'],
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
          admin: {
            width: '70%',
            description: 'Not on the MHA feed, so players added by the fixtures sync start without one.',
          },
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
    {
      name: 'mhaPlayerId',
      label: 'MHA player ID',
      type: 'text',
      index: true,
      admin: {
        position: 'sidebar',
        description:
          'Malta Handball Association registration id (e.g. "MHA-LASP-008"). Filled in by the fixtures sync, which links match-report line-ups and season stats on it.',
      },
    },
    {
      name: 'seasonStats',
      type: 'group',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Season totals across every MHA competition, refreshed by the fixtures sync.',
      },
      fields: [
        { name: 'season', type: 'text' },
        { name: 'appearances', type: 'number' },
        { name: 'goals', type: 'number' },
        { name: 'penaltyGoals', label: '7m goals', type: 'number' },
        { name: 'yellowCards', type: 'number' },
        { name: 'suspensions', label: '2-minute suspensions', type: 'number' },
        { name: 'redCards', type: 'number' },
        { name: 'blueCards', type: 'number' },
        { name: 'mvp', label: 'MVP awards', type: 'number' },
        { name: 'syncedAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
      ],
    },
  ],
}
