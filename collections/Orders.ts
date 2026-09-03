import type { CollectionConfig, Where } from 'payload'
import { sendOrderConfirmation } from '@/lib/email/orderConfirmation'
import { collectionWriteAccess, hasRole } from '@/lib/auth/roles'

export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: { singular: 'Order', plural: 'Orders' },
  admin: {
    useAsTitle: 'orderNumber',
    defaultColumns: ['orderNumber', 'customerEmail', 'total', 'status', 'createdAt'],
  },
  access: {
    create: collectionWriteAccess('orders'),
    delete: collectionWriteAccess('orders'),
    // Staff who run the shop see every order; a customer only ever sees their own.
    // Storefront pages read orders through the Local API with `overrideAccess`,
    // so this governs the REST/GraphQL surface.
    read: ({ req: { user } }) => {
      if (!user) return false
      if (hasRole(user, 'admin', 'shop-manager')) return true
      const ownOrders: Where = {
        or: [{ user: { equals: user.id } }, { customerEmail: { equals: user.email } }],
      }
      return ownOrders
    },
    update: collectionWriteAccess('orders'),
  },
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        if (operation === 'create' && !data?.orderNumber) {
          const yyyymm = new Date().toISOString().slice(0, 7).replace('-', '')
          const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
          data.orderNumber = `LSH-${yyyymm}-${rand}`
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, operation }) => {
        const becamePaid =
          doc?.status === 'paid' && (operation === 'create' || previousDoc?.status !== 'paid')
        if (becamePaid) {
          try {
            await sendOrderConfirmation(doc)
          } catch (err) {
            console.error('[orders] failed to send confirmation email', err)
          }
        }
      },
    ],
  },
  fields: [
    {
      name: 'orderNumber',
      type: 'text',
      unique: true,
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Paid', value: 'paid' },
        { label: 'Fulfilled', value: 'fulfilled' },
        { label: 'Cancelled', value: 'cancelled' },
        { label: 'Refunded', value: 'refunded' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'user', type: 'relationship', relationTo: 'users' },
    { name: 'customerEmail', type: 'email', required: true },
    { name: 'customerName', type: 'text' },
    { name: 'customerPhone', type: 'text' },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        { name: 'productTitle', type: 'text', required: true },
        { name: 'product', type: 'relationship', relationTo: 'products' },
        {
          name: 'bundleParentLineId',
          type: 'text',
          admin: { description: 'Set when this line was expanded from a bundle cart line.' },
        },
        { name: 'quantity', type: 'number', required: true, defaultValue: 1 },
        { name: 'unitPrice', type: 'number', required: true, admin: { description: 'Cents' } },
        {
          name: 'customFieldValues',
          type: 'json',
          admin: { description: 'Snapshot of per-unit custom fields { firstName, size, ... }' },
        },
      ],
    },
    { name: 'subtotal', type: 'number', required: true },
    { name: 'total', type: 'number', required: true },
    { name: 'currency', type: 'text', required: true, defaultValue: 'eur' },
    { name: 'stripeCheckoutSessionId', type: 'text', admin: { readOnly: true } },
    { name: 'stripePaymentIntentId', type: 'text', admin: { readOnly: true } },
    { name: 'paidAt', type: 'date', admin: { readOnly: true } },
  ],
}
