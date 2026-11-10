import type { CollectionConfig, Where } from 'payload'
import { sendShopEmail, type ShopEmailKind } from '@/lib/email/shopEmails'
import { cancelMembershipsForOrder, createMembershipsForOrder } from '@/lib/shop/memberships'
import { decrementStockForOrder } from '@/lib/shop/stock'
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
        const became = (status: string) =>
          doc?.status === status && (operation === 'create' || previousDoc?.status !== status)
        // Emails never block the status change; a failed send is logged.
        const send = async (kind: ShopEmailKind) => {
          try {
            await sendShopEmail(req.payload, kind, doc)
          } catch (err) {
            req.payload.logger.error({ err, msg: `[orders] failed to send ${kind} email for ${doc?.orderNumber}` })
          }
        }

        if (became('paid')) {
          await createMembershipsForOrder(doc, req)
          const oversold = await decrementStockForOrder(req.payload, doc, req)
          if (oversold.length) {
            req.payload.logger.warn({ msg: `[orders] ${doc?.orderNumber} oversold: ${oversold.join('; ')}` })
            await req.payload.update({ collection: 'orders', id: doc.id, data: { stockWarning: oversold.join('\n') } as any, req, overrideAccess: true })
          }
          await send('confirmation')
          await send('staff')
        }
        if (became('ready')) await send('ready')
        if (became('shipped')) await send('shipped')
        if (became('refunded')) await send('refund')

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
        // Setting either of these emails the buyer (see the afterChange hook).
        { label: 'Ready to collect', value: 'ready' },
        { label: 'Shipped', value: 'shipped' },
        { label: 'Fulfilled', value: 'fulfilled' },
        { label: 'Cancelled', value: 'cancelled' },
        { label: 'Refunded', value: 'refunded' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Ready to collect and Shipped email the buyer. Refunded emails them too.',
        components: { Cell: '@/components/admin/orders/cells#StatusCell' },
      },
    },
    {
      name: 'paymentProvider',
      type: 'select',
      defaultValue: 'club',
      options: [
        { label: 'Club Stripe', value: 'club' },
        { label: 'Rypple', value: 'membrs' },
      ],
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Memberships are paid through Rypple; everything else through the club shop.',
      },
    },
    { name: 'paidAt', type: 'date', admin: { position: 'sidebar', readOnly: true } },
    {
      name: 'stockWarning',
      label: 'Oversold',
      type: 'textarea',
      admin: {
        position: 'sidebar',
        readOnly: true,
        condition: (data) => Boolean(data?.stockWarning),
        description: 'There was less in stock than this order took when it was paid. Restock or contact the buyer.',
      },
    },
    {
      name: 'paymentError',
      label: 'Why payment failed',
      type: 'textarea',
      // Customers can read their own orders over REST, and this is written for staff.
      access: { read: ({ req: { user } }) => hasRole(user, 'admin', 'shop-manager') },
      admin: {
        position: 'sidebar',
        readOnly: true,
        condition: (data) => Boolean(data?.paymentError),
        description: 'The buyer saw a general message. This is what went wrong.',
      },
    },
    {
      name: 'refundedTotal',
      label: 'Refunded',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', readOnly: true, description: 'Cents, as confirmed by Stripe', condition: (data) => Number(data?.refundedTotal) > 0 },
    },
    {
      name: 'refund',
      type: 'ui',
      admin: { position: 'sidebar', components: { Field: '@/components/admin/orders/RefundPanel#RefundPanel' } },
    },
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
          name: 'fulfilment',
          type: 'group',
          admin: { description: 'How the buyer gets the order, chosen at checkout.' },
          fields: [
            {
              name: 'method',
              type: 'select',
              defaultValue: 'collect',
              options: [
                { label: 'Collect at the club', value: 'collect' },
                { label: 'Delivery', value: 'deliver' },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'methodTitle', label: 'Shipping option', type: 'text', admin: { width: '50%', description: 'As the buyer saw it, e.g. "Standard delivery".' } },
                { name: 'country', type: 'text', admin: { width: '50%', description: 'ISO code, e.g. MT' } },
              ],
            },
            {
              type: 'row',
              admin: { condition: (_, sibling) => sibling?.method === 'deliver' },
              fields: [
                { name: 'addressLine1', label: 'Address', type: 'text', admin: { width: '50%' } },
                { name: 'addressLine2', label: 'Address line 2', type: 'text', admin: { width: '50%' } },
                { name: 'locality', type: 'text', admin: { width: '50%' } },
                { name: 'postcode', type: 'text', admin: { width: '50%' } },
              ],
            },
            { name: 'note', label: 'Buyer note', type: 'textarea' },
          ],
        },
        {
          name: 'consent',
          type: 'group',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'termsAcceptedAt', label: 'Terms accepted', type: 'date', admin: { readOnly: true, width: '50%', date: { pickerAppearance: 'dayAndTime' } } },
                { name: 'marketingOptIn', label: 'Wants club news and offers', type: 'checkbox', admin: { readOnly: true, width: '50%' } },
              ],
            },
          ],
        },
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
            {
              type: 'row',
              fields: [
                { name: 'variantTitle', label: 'Variant', type: 'text', admin: { width: '33%', description: 'e.g. M / Black' } },
                { name: 'sku', label: 'SKU', type: 'text', admin: { width: '33%' } },
                { name: 'variantId', type: 'text', admin: { width: '33%', readOnly: true } },
              ],
            },
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
          type: 'row',
          fields: [
            { name: 'deliveryFee', type: 'number', defaultValue: 0, admin: { width: '33%', description: 'Cents' } },
            { name: 'discountTotal', label: 'Discount', type: 'number', defaultValue: 0, admin: { width: '33%', description: 'Cents, from a coupon or a Stripe promotion code' } },
            { name: 'vatIncluded', label: 'VAT included', type: 'number', defaultValue: 0, admin: { width: '33%', description: 'Cents, inside the total' } },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'couponCode', type: 'text', index: true, admin: { width: '33%', description: 'Store coupon used at checkout' } },
            { name: 'taxAdded', label: 'Tax added', type: 'number', defaultValue: 0, admin: { width: '33%', description: 'Cents, on top of prices entered without tax' } },
          ],
        },
        {
          name: 'stripeCheckoutSessionId',
          type: 'text',
          index: true,
          admin: { readOnly: true, description: 'For Rypple orders this is the Rypple checkout id.' },
        },
        { name: 'stripePaymentIntentId', type: 'text', admin: { readOnly: true } },
      ],
    },
  ],
}
