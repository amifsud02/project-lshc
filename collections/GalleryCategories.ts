import { slugField, type CollectionConfig } from 'payload'
import { collectionWriteAccess } from '@/lib/auth/roles'

export const GalleryCategories: CollectionConfig = {
  slug: 'gallery-categories',
  labels: {
    singular: 'Gallery Category',
    plural: 'Gallery Categories',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', '_status', 'updatedAt'],
    group: 'Gallery',
  },
  access: {
    create: collectionWriteAccess('gallery-categories'),
    delete: collectionWriteAccess('gallery-categories'),
    read: () => true,
    update: collectionWriteAccess('gallery-categories'),
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
