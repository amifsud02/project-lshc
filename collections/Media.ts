import type { CollectionConfig } from 'payload'
import { collectionWriteAccess } from '@/lib/auth/roles'

export const Media: CollectionConfig = {
  slug: 'media',
  folders: true,
  admin: {
    group: 'Gallery',
  },
  access: {
    create: collectionWriteAccess('media'),
    delete: collectionWriteAccess('media'),
    read: () => true,
    update: collectionWriteAccess('media'),
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      // required: true,
    },
  ],
  upload: true,
}
