import type { CollectionConfig, Field } from 'payload'
import { collectionWriteAccess } from '@/lib/auth/roles'
import { buildFixtureSlug } from '@/lib/utils/fixtureSlug'

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
    components: {
      beforeListTable: ['@/components/admin/MhaFixturesSync#MhaFixturesSync'],
    },
  },
  access: {
    create: collectionWriteAccess('fixtures'),
    delete: collectionWriteAccess('fixtures'),
    read: () => true,
    update: collectionWriteAccess('fixtures'),
  },
  hooks: {
    /**
     * The public match-report URL is derived from the two clubs and the kick-off
     * date, so it is rebuilt whenever any of those three change rather than being
     * frozen at creation — a corrected date or opponent would otherwise leave a
     * slug that reads wrong.
     */
    beforeChange: [
      async ({ data, originalDoc, req }) => {
        const homeTeam = data.homeTeam ?? originalDoc?.homeTeam
        const awayTeam = data.awayTeam ?? originalDoc?.awayTeam
        const startDate = data.startDate ?? originalDoc?.startDate

        const slug = await buildFixtureSlug({
          homeTeam,
          awayTeam,
          startDate,
          currentId: originalDoc?.id,
          req,
        })

        if (slug) data.slug = slug
        return data
      },
    ],
  },
  fields: [
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description:
          'Public match-report URL. Generated from the teams and kick-off date.',
      },
    },
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
        { label: 'LBSH', value: 'LBSH' },
        { label: 'Kirkop Sports Hall', value: 'KSH' },
        { label: 'TBC', value: 'TBC' },
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
    {
      type: 'collapsible',
      label: 'Line-ups',
      admin: {
        initCollapsed: true,
        condition: (_, siblingData) => siblingData?.status === 'Finished',
        description: 'Filled from the MHA match report by the fixtures sync once the match has ended.',
      },
      fields: [lineupField('homeLineup', 'Home line-up'), lineupField('awayLineup', 'Away line-up')],
    },
  ],
}

/** A team sheet with each player's match stats, as recorded on the MHA match report. */
function lineupField(name: string, label: string): Field {
  return {
    name,
    label,
    type: 'array',
    labels: { singular: 'Player', plural: 'Players' },
    admin: {
      components: { RowLabel: '@/components/admin/LineupRowLabel#LineupRowLabel' },
    },
    fields: [
      {
        type: 'row',
        fields: [
          { name: 'number', type: 'number', min: 0, max: 99, admin: { width: '15%' } },
          { name: 'name', type: 'text', required: true, admin: { width: '45%' } },
          {
            name: 'player',
            type: 'relationship',
            relationTo: 'players',
            admin: { width: '40%', description: 'Set for La Salle players only.' },
          },
        ],
      },
      {
        type: 'row',
        fields: [
          { name: 'goals', type: 'number', min: 0, defaultValue: 0, admin: { width: '20%' } },
          { name: 'penaltyGoals', label: '7m goals', type: 'number', min: 0, defaultValue: 0, admin: { width: '20%' } },
          { name: 'penaltyAttempts', label: '7m given', type: 'number', min: 0, defaultValue: 0, admin: { width: '20%' } },
          { name: 'mvp', label: 'MVP', type: 'checkbox', admin: { width: '20%' } },
        ],
      },
      {
        type: 'row',
        fields: [
          { name: 'yellowCard', type: 'text', admin: { width: '25%', placeholder: 'MM:SS' } },
          {
            name: 'suspensions',
            label: '2-minute suspensions',
            type: 'text',
            hasMany: true,
            maxRows: 3,
            admin: { width: '50%', description: 'Match clock of each suspension.' },
          },
          { name: 'redCard', type: 'text', admin: { width: '25%', placeholder: 'MM:SS' } },
        ],
      },
      {
        name: 'mhaPlayerId',
        label: 'MHA player ID',
        type: 'text',
        index: true,
        admin: { readOnly: true },
      },
    ],
  }
}
