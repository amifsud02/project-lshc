import { slugField, type CollectionConfig } from 'payload'
import { collectionWriteAccess } from '@/lib/auth/roles'

export const Teams: CollectionConfig = {
  slug: 'teams',
  labels: {
    singular: 'Team',
    plural: 'Teams',
  },
  admin: {
    useAsTitle: 'teamName',
    defaultColumns: ['teamName', 'shortName', 'slug', 'updatedAt'],
    group: 'Handball Management',
  },
  access: {
    create: collectionWriteAccess('teams'),
    delete: collectionWriteAccess('teams'),
    read: () => true,
    update: collectionWriteAccess('teams'),
  },
  fields: [
    {
      name: 'teamName',
      type: 'text',
      required: true,
    },
    {
      name: 'shortName',
      type: 'text',
      maxLength: 5,
      admin: { description: 'Abbreviation shown on compact fixture cards, e.g. "LSH".' },
    },
    slugField({
      name: 'slug',
      required: true,
      position: 'sidebar',
      useAsSlug: 'teamName',
    }),
    {
      name: 'teamLogo',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'mhaTeamIds',
      label: 'MHA team IDs',
      type: 'text',
      hasMany: true,
      index: true,
      admin: {
        position: 'sidebar',
        description:
          'Malta Handball Association team ids (e.g. "TEAM-LASALLE-SM-001") that the fixtures sync maps onto this team. Filled in automatically; add an id here to point an MHA team at this one instead.',
      },
    },
  ],
}
