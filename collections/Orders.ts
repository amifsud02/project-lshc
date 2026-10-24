import type { CollectionConfig, Where } from 'payload'
import { sendOrderConfirmation } from '@/lib/email/orderConfirmation'
import { cancelMembershipsForOrder, createMembershipsForOrder } from '@/lib/shop/memberships'
import { collectionWriteAccess, hasRole } from '@/lib/auth/roles'

export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: { singular: 'Order', plural: 'Orders' },
  admin: {
    useAsTitle: 'orderNumber',
    defaultColumns: ['orderNumber', 'customerName', 'items', 'total', 'status', 'createdAt'],
    listSearchableFields: ['orderNumber', 'customerName', 'customerEmail', 'customerPhone'],
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
      async ({ doc, previousDoc, operation, req }) => {
        const becamePaid =
          doc?.status === 'paid' && (operation === 'create' || previousDoc?.status !== 'paid')
        if (becamePaid) {
          await createMembershipsForOrder(doc, req)
          try {
            await sendOrderConfirmation(doc)
          } catch (err) {
            console.error('[orders] failed to send confirmation email', err)
          }
        }

        const becameVoid =
          (doc?.status === 'refunded' || doc?.status === 'cancelled') && previousDoc?.status !== doc?.status
        if (becameVoid) await cancelMembershipsForOrder(doc, req)
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
      admin: { position: 'sidebar', components: { Cell: '@/components/admin/orders/cells#StatusCell' } },
    },
    {
      name: 'paymentProvider',
      type: 'select',
      defaultValue: 'club',
      options: [
        { label: 'Club Stripe', value: 'club' },
        { label: 'MEMBRS', value: 'membrs' },
      ],
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Memberships are paid through MEMBRS; everything else through the club shop.',
      },
    },
    { name: 'paidAt', type: 'date', admin: { position: 'sidebar', readOnly: true } },
    {
      name: 'summary',
      type: 'ui',
      admin: { components: { Field: '@/components/admin/orders/OrderSummary#OrderSummary' } },
    },
    {
      // Everything the summary above is built from, tucked away: it's rarely changed by hand.
      type: 'collapsible',
      label: 'Order record',
      admin: {
        initCollapsed: true,
        description: 'The order as saved at checkout. Only change it to correct a mistake.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'customerName',
              type: 'text',
              admin: { width: '33%', components: { Cell: '@/components/admin/orders/cells#CustomerCell' } },
            },
            { name: 'customerEmail', type: 'email', required: true, admin: { width: '33%' } },
            { name: 'customerPhone', type: 'text', admin: { width: '33%' } },
          ],
        },
        { name: 'user', type: 'relationship', relationTo: 'users' },
        {
          name: 'items',
          type: 'array',
          required: true,
          minRows: 1,
          labels: { singular: 'Item', plural: 'Items' },
          admin: {
            initCollapsed: true,
            components: {
              RowLabel: '@/components/admin/orders/OrderItemRowLabel#OrderItemRowLabel',
              Cell: '@/components/admin/orders/cells#ItemsCell',
            },
          },
          fields: [
            { name: 'productTitle', type: 'text', required: true },
            { name: 'product', type: 'relationship', relationTo: 'products' },
            {
              name: 'bundleParentLineId',
              type: 'text',
              admin: { description: 'Set when this line was expanded from a bundle cart line.' },
            },
            {
              name: 'membershipSeason',
              type: 'text',
              admin: {
                readOnly: true,
                description: 'Set on each member of a membership; a membership record is created for it once paid.',
              },
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
        {
          type: 'row',
          fields: [
            { name: 'subtotal', type: 'number', required: true, admin: { width: '33%', description: 'Cents' } },
            {
              name: 'total',
              type: 'number',
              required: true,
              admin: {
                width: '33%',
                description: 'Cents',
                components: { Cell: '@/components/admin/orders/cells#MoneyCell' },
              },
            },
            { name: 'currency', type: 'text', required: true, defaultValue: 'eur', admin: { width: '33%' } },
          ],
        },
        {
          name: 'stripeCheckoutSessionId',
          type: 'text',
          index: true,
          admin: { readOnly: true, description: 'For MEMBRS orders this is the MEMBRS checkout id.' },
        },
        { name: 'stripePaymentIntentId', type: 'text', admin: { readOnly: true } },
      ],
    },
  ],
}
