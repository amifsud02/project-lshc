import type { CollectionConfig, Field } from 'payload'
import { collectionWriteAccess } from '@/lib/auth/roles'
import { buildPlayerSlug } from '@/lib/players/profile'

const statFields: Field[] = [
  { name: 'appearances', type: 'number' },
  { name: 'goals', type: 'number' },
  { name: 'penaltyGoals', label: '7m goals', type: 'number' },
  { name: 'yellowCards', type: 'number' },
  { name: 'suspensions', label: '2-minute suspensions', type: 'number' },
  { name: 'redCards', type: 'number' },
  { name: 'blueCards', type: 'number' },
  { name: 'mvp', label: 'MVP awards', type: 'number' },
]

export const Players: CollectionConfig = {
  slug: 'players',
  labels: {
    singular: 'Player',
    plural: 'Players',
  },
  admin: {
    defaultColumns: ['fullName', 'number', 'position', 'team', 'otherTeams', 'profilePage', 'updatedAt'],
    listSearchableFields: ['firstName', 'lastName', 'mhaPlayerId'],
    group: 'Handball Management',
  },
  access: {
    create: collectionWriteAccess('players'),
    delete: collectionWriteAccess('players'),
    read: () => true,
    update: collectionWriteAccess('players'),
  },
  hooks: {
    /**
     * The profile URL follows the name, so a corrected spelling fixes the URL too.
     * Players saved before slugs existed get one the next time they are saved, which
     * includes switching their profile page on and every fixtures sync.
     */
    beforeChange: [
      async ({ data, originalDoc, req }) => {
        const firstName = data.firstName ?? originalDoc?.firstName
        const lastName = data.lastName ?? originalDoc?.lastName
        const renamed = firstName !== originalDoc?.firstName || lastName !== originalDoc?.lastName
        if (!renamed && originalDoc?.slug) return data

        const slug = await buildPlayerSlug({ firstName, lastName, currentId: originalDoc?.id, req })
        if (slug) data.slug = slug
        return data
      },
    ],
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
      admin: { description: 'The squad the player is listed under first.' },
    },
    {
      name: 'otherTeams',
      label: 'Also plays for',
      type: 'relationship',
      relationTo: 'teams',
      hasMany: true,
      index: true,
      admin: {
        description:
          'Other club squads this player turns out for, e.g. HMS as well as La Salle. The fixtures sync adds a squad here when the player appears in its line-up.',
      },
    },
    {
      name: 'profilePicture',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'profilePage',
      label: 'Public profile page',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      admin: {
        position: 'sidebar',
        description:
          'Shows this player at /players/<slug>, with their season stats and recent matches, and links their name from match line-ups. Only for adult players who agree to it; never for anyone under 18.',
      },
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Profile page URL. Generated from the name.',
      },
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
        description: 'Current season totals across every MHA competition and squad, refreshed by the fixtures sync.',
      },
      fields: [
        { name: 'season', type: 'text' },
        { name: 'seasonId', type: 'text', admin: { hidden: true } },
        ...statFields,
        { name: 'syncedAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
      ],
    },
    {
      name: 'pastSeasons',
      type: 'array',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Final totals of earlier MHA seasons, kept by the fixtures sync once a season ends.',
      },
      fields: [{ name: 'season', type: 'text' }, { name: 'seasonId', type: 'text', admin: { hidden: true } }, ...statFields],
    },
    {
      name: 'careerStats',
      type: 'group',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Totals across every MHA season, refreshed by the fixtures sync.',
      },
      fields: statFields,
    },
  ],
}
