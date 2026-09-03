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
  ],
}
