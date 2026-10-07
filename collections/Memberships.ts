import type { CollectionConfig } from 'payload'
import { collectionWriteAccess, hasRole } from '@/lib/auth/roles'

/**
 * The member register. One record per person, created automatically when an
 * order containing a membership is paid; staff can also add members by hand
 * (e.g. someone who paid in cash).
 */
export const Memberships: CollectionConfig = {
  slug: 'memberships',
  labels: { singular: 'Membership', plural: 'Memberships' },
  admin: {
    useAsTitle: 'fullName',
    defaultColumns: ['fullName', 'mobile', 'season', 'product', 'status', 'createdAt'],
    listSearchableFields: ['firstName', 'lastName', 'mobile', 'email'],
  },
  access: {
    create: collectionWriteAccess('memberships'),
    delete: collectionWriteAccess('memberships'),
    // Holds members' contact details, so it is never public.
    read: ({ req: { user } }) => hasRole(user, 'admin', 'shop-manager'),
    update: collectionWriteAccess('memberships'),
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
        data.fullName = [data.firstName, data.lastName].filter(Boolean).join(' ')
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
    { name: 'fullName', type: 'text', admin: { hidden: true } },
    {
      type: 'row',
      fields: [
        { name: 'mobile', type: 'text', required: true, index: true, admin: { width: '50%' } },
        { name: 'email', type: 'email', admin: { width: '50%' } },
      ],
    },
    { name: 'season', type: 'text', required: true, index: true, admin: { position: 'sidebar' } },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'product', type: 'relationship', relationTo: 'products', admin: { position: 'sidebar' } },
    {
      name: 'order',
      type: 'relationship',
      relationTo: 'orders',
      index: true,
      admin: { position: 'sidebar', description: 'Empty for members added by hand.' },
    },
    {
      name: 'details',
      type: 'json',
      admin: { description: 'Any extra answers given at checkout, e.g. card pick-up location.' },
    },
  ],
}
