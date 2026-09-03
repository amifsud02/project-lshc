import type { Access, CollectionConfig } from 'payload'

import { adminOnly, adminOnlyField, hasRole, isAdmin, isStaff, roleOptions } from '@/lib/auth/roles'

/**
 * The `users` collection doubles as the storefront customer list. Customers hold
 * no roles, which keeps them out of the admin panel while still letting them log
 * in to the shop and see their own orders.
 */

/** Admins and shop managers need the full list; everyone else only ever sees themselves. */
const readUsers: Access = ({ req: { user } }) => {
  if (!user) return false
  if (hasRole(user, 'admin', 'shop-manager')) return true
  return { id: { equals: user.id } }
}

const updateUsers: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isAdmin(user)) return true
  return { id: { equals: user.id } }
}

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: ({ req: { user } }) => isStaff(user),
    // Public so the storefront register form can create customer accounts. The
    // `roles` field below is admin-only, so nobody can sign themselves up as staff.
    create: () => true,
    delete: adminOnly,
    read: readUsers,
    unlock: adminOnly,
    update: updateUsers,
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'firstName', 'lastName', 'roles'],
  },
  auth: true,
  fields: [
    { name: 'firstName', type: 'text' },
    { name: 'lastName', type: 'text' },
    { name: 'phone', type: 'text' },
    {
      name: 'roles',
      type: 'select',
      access: { create: adminOnlyField, update: adminOnlyField },
      admin: {
        description:
          'Grants access to the admin panel. Leave empty for storefront customers.',
        position: 'sidebar',
      },
      hasMany: true,
      label: 'Staff roles',
      options: roleOptions,
    },
    {
      name: 'googleSub',
      type: 'text',
      access: { create: adminOnlyField, read: adminOnlyField, update: adminOnlyField },
      admin: {
        description: 'Google account ID, set automatically on Google sign-in.',
        position: 'sidebar',
        readOnly: true,
      },
      index: true,
      label: 'Google account ID',
    },
  ],
}
