import type { CollectionConfig } from 'payload'

export const Fixtures: CollectionConfig = {
  slug: 'fixtures',
  labels: {
    singular: 'Fixture',
    plural: 'Fixtures',
  },
  admin: {
    useAsTitle: 'fixtureCode',
    defaultColumns: [
      'fixtureCode',
      'homeTeam',
      'awayTeam',
      'startDate',
      'status',
      'competition',
    ],
    group: 'Handball Management',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'fixtureCode',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'homeTeam',
          type: 'relationship',
          relationTo: 'teams',
          required: true,
          admin: { width: '50%' },
        },
        {
          name: 'awayTeam',
          type: 'relationship',
          relationTo: 'teams',
          required: true,
          admin: { width: '50%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'homeScore',
          type: 'number',
          defaultValue: 0,
          min: 0,
          admin: {
            width: '50%',
            condition: (_, siblingData) => siblingData?.status !== 'Scheduled',
          },
        },
        {
          name: 'awayScore',
          type: 'number',
          defaultValue: 0,
          min: 0,
          admin: {
            width: '50%',
            condition: (_, siblingData) => siblingData?.status !== 'Scheduled',
          },
        },
      ],
    },
    {
      name: 'startDate',
      type: 'date',
      required: true,
      index: true,
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'venue',
      type: 'select',
      required: true,
      options: [
        { label: 'USH', value: 'USH' },
        { label: 'SHPH', value: 'SHPH' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'Scheduled',
      options: [
        { label: 'Scheduled', value: 'Scheduled' },
        { label: 'Finished', value: 'Finished' },
        { label: 'Cancelled', value: 'Cancelled' },
        { label: 'Postponed', value: 'Postponed' },
      ],
    },
    {
      name: 'competition',
      type: 'relationship',
      relationTo: 'competitions',
      required: true,
      index: true,
    },
  ],
}
