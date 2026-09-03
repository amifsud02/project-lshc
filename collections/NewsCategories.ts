import { slugField, type CollectionConfig } from 'payload'
import { collectionWriteAccess } from '@/lib/auth/roles'

export const NewsCategories: CollectionConfig = {
  slug: 'news-categories',
  labels: {
    singular: 'News Category',
    plural: 'News Categories',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', '_status', 'updatedAt'],
    group: 'News and Posts',
  },
  access: {
    create: collectionWriteAccess('news-categories'),
    delete: collectionWriteAccess('news-categories'),
    read: () => true,
    update: collectionWriteAccess('news-categories'),
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    slugField({
      name: 'slug',
      required: true,
      position: 'sidebar',
      useAsSlug: 'title',
    })
  ],
}
