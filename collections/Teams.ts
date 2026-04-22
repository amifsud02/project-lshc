import { slugField, type CollectionConfig } from 'payload'

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
    read: () => true,
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
