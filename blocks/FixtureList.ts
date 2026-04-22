import type { Block } from 'payload'

export const FixtureListBlock: Block = {
  slug: 'fixtureList',
  interfaceName: 'FixtureListBlock',
  labels: {
    singular: 'Fixture List',
    plural: 'Fixture Lists',
  },
  fields: [
    { name: 'showTitle', type: 'checkbox', defaultValue: true },
    { name: 'title', type: 'text' },
    {
      name: 'competition',
      type: 'relationship',
      relationTo: 'competitions',
      admin: { description: 'Leave blank for all competitions.' },
    },
    {
      name: 'team',
      type: 'relationship',
      relationTo: 'teams',
      admin: { description: 'Leave blank for all teams.' },
    },
    {
      name: 'statuses',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Scheduled', value: 'Scheduled' },
        { label: 'Finished', value: 'Finished' },
        { label: 'Cancelled', value: 'Cancelled' },
        { label: 'Postponed', value: 'Postponed' },
      ],
      admin: { description: 'Leave empty to include all statuses.' },
    },
    {
      name: 'limit',
      type: 'number',
      defaultValue: 10,
      min: 1,
      max: 100,
    },
    {
      name: 'sortOrder',
      type: 'select',
      defaultValue: 'asc',
      options: [
        { label: 'Upcoming first (date asc)', value: 'asc' },
        { label: 'Most recent first (date desc)', value: 'desc' },
      ],
    },
  ],
}
