import type { CollectionConfig } from 'payload'
import { collectionWriteAccess } from '@/lib/auth/roles'

/**
 * Shared list of the halls and gyms the club trains and plays in. Nursery
 * training sessions point at these so a venue rename is a one-place edit.
 */
export const Venues: CollectionConfig = {
  slug: 'venues',
  labels: { singular: 'Venue', plural: 'Venues' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'locality', 'updatedAt'],
    group: 'Handball Management',
  },
  access: {
    create: collectionWriteAccess('venues'),
    delete: collectionWriteAccess('venues'),
    read: () => true,
    update: collectionWriteAccess('venues'),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: { description: 'As it should appear to parents, e.g. "De La Salle College Gym".' },
    },
    {
      type: 'row',
      fields: [
        { name: 'locality', type: 'text', admin: { width: '50%' } },
        {
          name: 'mapUrl',
          type: 'text',
          label: 'Google Maps link',
          admin: { width: '50%' },
        },
      ],
    },
    { name: 'address', type: 'textarea' },
    {
      name: 'notes',
      type: 'textarea',
      admin: { description: 'Parking, which entrance to use, and anything else parents ask about.' },
    },
  ],
}
