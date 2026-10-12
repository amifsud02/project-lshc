import type { CollectionConfig } from 'payload'
import { collectionWriteAccess } from '@/lib/auth/roles'
import { isVideoMime, toCloudinaryVideoUrl } from '@/lib/media/cloudinaryVideo'

export const Media: CollectionConfig = {
  slug: 'media',
  folders: true,
  admin: {
    group: 'Gallery',
  },
  hooks: {
    afterRead: [
      ({ doc }) => {
        if (isVideoMime(doc?.mimeType) && typeof doc.url === 'string') {
          doc.url = toCloudinaryVideoUrl(doc.url)
        }
        return doc
      },
    ],
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
