import { APIError, type Access, type CollectionConfig } from 'payload'

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
    // Customers only ever get an account through a magic link or Google, both of
    // which prove they own the email (see `findOrCreateCustomer`). Orders and
    // nursery registrations are shared with whoever holds the matching email, so
    // an account must never be created for an address its holder hasn't proven.
    create: adminOnly,
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
  hooks: {
    beforeChange: [
      // Same reason as `create`: changing your email would hand you someone else's orders.
      ({ data, operation, originalDoc, req }) => {
        if (operation !== 'update' || typeof data?.email !== 'string' || isAdmin(req.user)) return data
        if (data.email.toLowerCase().trim() !== String(originalDoc?.email ?? '').toLowerCase()) {
          throw new APIError('Only an admin can change an account email.', 403)
        }
        return data
      },
    ],
  },
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
