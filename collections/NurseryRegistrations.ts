import type { Access, CollectionConfig, Where } from 'payload'
import { adminOnly, collectionWriteAccess, hasRole, roleFieldAccess } from '@/lib/auth/roles'
import { sendRegistrationEmail } from '@/lib/email/nurseryRegistration'

/**
 * One child, one season. Created by the registration form through the Local API,
 * which is why the REST create surface stays shut — nothing about a minor should
 * be writable by an unauthenticated POST.
 *
 * Reads are limited to admins and nursery managers, plus the parent's own
 * account. Coaches deliberately do not get this collection: they need a roster,
 * not dates of birth and medical notes.
 */

const readRegistrations: Access = ({ req: { user } }) => {
  if (!user) return false
  if (hasRole(user, 'admin', 'nursery-manager')) return true
  const own: Where = { user: { equals: user.id } }
  return own
}

/** Only the people who actually run the nursery see medical detail. */
const medicalAccess = roleFieldAccess('nursery-manager')

export const NurseryRegistrations: CollectionConfig = {
  slug: 'nursery-registrations',
  labels: { singular: 'Nursery Registration', plural: 'Nursery Registrations' },
  admin: {
    useAsTitle: 'registrationNumber',
    defaultColumns: ['registrationNumber', 'childName', 'category', 'status', 'createdAt'],
    group: 'Nursery',
    listSearchableFields: ['registrationNumber', 'child.firstName', 'child.lastName', 'parent.email'],
  },
  access: {
    // The public form writes through a server action on the Local API, so no
    // unauthenticated create is needed here.
    create: collectionWriteAccess('nursery-registrations'),
    delete: adminOnly,
    read: readRegistrations,
    update: collectionWriteAccess('nursery-registrations'),
  },
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        if (operation === 'create' && !data?.registrationNumber) {
          const yyyymm = new Date().toISOString().slice(0, 7).replace('-', '')
          const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
          data.registrationNumber = `LSN-${yyyymm}-${rand}`
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, operation }) => {
        const becamePaid =
          doc?.status === 'paid' && (operation === 'create' || previousDoc?.status !== 'paid')
        if (!becamePaid) return
        try {
          await sendRegistrationEmail(doc, 'paid')
        } catch (err) {
          console.error('[nursery] failed to send confirmation email', err)
        }
      },
    ],
  },
  fields: [
    {
      name: 'registrationNumber',
      type: 'text',
      unique: true,
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      admin: { position: 'sidebar' },
      options: [
        { label: 'Pending payment', value: 'pending' },
        { label: 'Awaiting bank transfer', value: 'awaiting-transfer' },
        { label: 'Paid', value: 'paid' },
        { label: 'Cancelled', value: 'cancelled' },
        { label: 'Refunded', value: 'refunded' },
      ],
    },
    {
      name: 'paymentMethod',
      type: 'select',
      required: true,
      defaultValue: 'card',
      admin: { position: 'sidebar' },
      options: [
        { label: 'Card', value: 'card' },
        { label: 'Bank transfer', value: 'bank-transfer' },
      ],
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      admin: { position: 'sidebar', description: 'Set when the parent was signed in.' },
    },
    {
      name: 'player',
      type: 'relationship',
      relationTo: 'players',
      admin: {
        position: 'sidebar',
        description: 'Link once the child has a squad record.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'season',
          type: 'relationship',
          relationTo: 'nursery-seasons',
          required: true,
          index: true,
          admin: { width: '50%' },
        },
        {
          name: 'category',
          type: 'relationship',
          relationTo: 'nursery-categories',
          required: true,
          index: true,
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'childName',
      type: 'text',
      virtual: true,
      admin: { hidden: true, readOnly: true },
      hooks: {
        afterRead: [
          ({ data }) => {
            const child = (data as { child?: { firstName?: string; lastName?: string } })?.child
            return `${child?.firstName ?? ''} ${child?.lastName ?? ''}`.trim()
          },
        ],
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Child',
          fields: [
            {
              name: 'child',
              type: 'group',
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'firstName', type: 'text', required: true, admin: { width: '50%' } },
                    { name: 'lastName', type: 'text', required: true, admin: { width: '50%' } },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'dateOfBirth',
                      type: 'date',
                      required: true,
                      admin: { width: '34%', date: { pickerAppearance: 'dayOnly' } },
                    },
                    {
                      name: 'gender',
                      type: 'select',
                      required: true,
                      admin: { width: '33%' },
                      options: [
                        { label: 'Boy', value: 'boy' },
                        { label: 'Girl', value: 'girl' },
                      ],
                    },
                    {
                      name: 'schoolYear',
                      type: 'text',
                      required: true,
                      admin: { width: '33%', description: 'e.g. Year 4, KG2' },
                    },
                  ],
                },
                { name: 'school', type: 'text' },
                {
                  name: 'kitSize',
                  type: 'text',
                  admin: { description: 'Shirt size for the club kit.' },
                },
              ],
            },
          ],
        },
        {
          label: 'Parent',
          fields: [
            {
              name: 'parent',
              type: 'group',
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'firstName', type: 'text', required: true, admin: { width: '50%' } },
                    { name: 'lastName', type: 'text', required: true, admin: { width: '50%' } },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'email', type: 'email', required: true, admin: { width: '50%' } },
                    { name: 'phone', type: 'text', required: true, admin: { width: '50%' } },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'relationshipToChild',
                      type: 'text',
                      admin: { width: '50%', description: 'e.g. Mother, Father, Guardian' },
                    },
                    {
                      name: 'idCardNumber',
                      type: 'text',
                      label: 'ID card number',
                      access: { read: medicalAccess, update: medicalAccess },
                      admin: {
                        width: '50%',
                        description: 'Needed only for the tax rebate documentation.',
                      },
                    },
                  ],
                },
              ],
            },
            {
              name: 'emergencyContact',
              type: 'group',
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'name', type: 'text', admin: { width: '40%' } },
                    { name: 'phone', type: 'text', admin: { width: '30%' } },
                    { name: 'relationship', type: 'text', admin: { width: '30%' } },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Medical',
          fields: [
            {
              name: 'medical',
              type: 'group',
              access: { read: medicalAccess, create: medicalAccess, update: medicalAccess },
              admin: {
                description: 'Visible to admins and nursery managers only.',
              },
              fields: [
                { name: 'conditions', type: 'textarea', label: 'Medical conditions' },
                { name: 'allergies', type: 'textarea' },
                { name: 'medication', type: 'textarea' },
                {
                  name: 'consentToTreatment',
                  type: 'checkbox',
                  label: 'Parent consents to emergency medical treatment',
                  defaultValue: false,
                },
              ],
            },
          ],
        },
        {
          label: 'Fee & consents',
          fields: [
            {
              name: 'fee',
              type: 'group',
              admin: {
                description:
                  'Snapshotted at registration so a later price change never rewrites what this parent agreed to.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'tierValue', type: 'text', required: true, admin: { width: '30%' } },
                    { name: 'tierLabel', type: 'text', required: true, admin: { width: '40%' } },
                    {
                      name: 'sessionsPerWeek',
                      type: 'number',
                      required: true,
                      admin: { width: '30%' },
                    },
                  ],
                },
                {
                  name: 'priceCents',
                  type: 'number',
                  required: true,
                  admin: { description: 'Cents' },
                },
              ],
            },
            {
              name: 'consents',
              type: 'group',
              fields: [
                {
                  name: 'privacy',
                  type: 'checkbox',
                  label: 'Privacy notice accepted',
                  defaultValue: false,
                },
                {
                  name: 'photo',
                  type: 'checkbox',
                  label: 'Photo and video consent',
                  defaultValue: false,
                },
                {
                  name: 'taxRebate',
                  type: 'checkbox',
                  label: 'Club may process the tax rebate',
                  defaultValue: false,
                },
              ],
            },
            { name: 'parentNotes', type: 'textarea', label: 'Anything the parent told us' },
            {
              name: 'internalNotes',
              type: 'textarea',
              access: { read: medicalAccess, create: medicalAccess, update: medicalAccess },
              admin: { description: 'Staff only — never shown to the parent.' },
            },
          ],
        },
      ],
    },
    { name: 'stripeCheckoutSessionId', type: 'text', admin: { readOnly: true } },
    { name: 'stripePaymentIntentId', type: 'text', admin: { readOnly: true } },
    { name: 'paidAt', type: 'date', admin: { readOnly: true } },
  ],
}
