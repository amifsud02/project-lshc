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
  upload: {
    // Photos arrive straight off cameras at 3-4 MB. Payload re-encodes JPEG, PNG, GIF, WebP,
    // TIFF and AVIF uploads as WebP no larger than 2560px, which is still sharp full-screen
    // on a retina display. SVGs and videos are stored as uploaded; animation and
    // transparency survive.
    resizeOptions: { width: 2560, height: 2560, fit: 'inside', withoutEnlargement: true },
    formatOptions: { format: 'webp', options: { quality: 80 } },
    // Files stream from the bucket through the app, so let browsers keep them for a day;
    // after that the ETag turns a re-check into a 304 instead of a full download.
    modifyResponseHeaders: ({ headers }) => {
      headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800')
      return headers
    },
  },
}
