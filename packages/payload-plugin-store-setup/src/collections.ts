import type { Access, CollectionConfig } from 'payload'
import { COUNTRIES, DISCOUNT_TYPES, FREE_SHIPPING_REQUIRES } from './reference'
import type { ResolvedSlugs, StoreSetupPluginOptions } from './types'

const writeAccess =
  (opts: StoreSetupPluginOptions): Access =>
  ({ req }) =>
    opts.access ? opts.access({ req }) : Boolean(req.user)

const base = (opts: StoreSetupPluginOptions) => ({
  admin: { group: opts.adminGroup ?? 'Store' },
  access: {
    read: writeAccess(opts),
    create: writeAccess(opts),
    update: writeAccess(opts),
    delete: writeAccess(opts),
  },
})

/** WooCommerce's tax rate table: one row per country/state/postcode match. */
export const taxRatesCollection = (opts: StoreSetupPluginOptions, slugs: ResolvedSlugs): CollectionConfig => ({
  slug: slugs.taxRates,
  labels: { singular: 'Tax rate', plural: 'Tax rates' },
  ...base(opts),
  admin: { ...base(opts).admin, useAsTitle: 'name', defaultColumns: ['name', 'country', 'state', 'rate', 'taxClass', 'priority'] },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'country', type: 'select', options: COUNTRIES, admin: { width: '33%', description: 'Empty matches every country.' } },
        { name: 'state', type: 'text', admin: { width: '33%' } },
        { name: 'postcodes', type: 'text', admin: { width: '33%', description: 'Semicolon-separated, wildcards (*) and ranges (…) allowed.' } },
      ],
    },
    { name: 'cities', type: 'text', admin: { description: 'Semicolon-separated.' } },
    {
      type: 'row',
      fields: [
        { name: 'rate', label: 'Rate %', type: 'number', required: true, min: 0, max: 100, admin: { width: '33%' } },
        { name: 'name', label: 'Tax name', type: 'text', required: true, defaultValue: 'VAT', admin: { width: '33%' } },
        { name: 'priority', type: 'number', defaultValue: 1, min: 1, admin: { width: '33%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'taxClass', type: 'text', defaultValue: 'standard', admin: { width: '33%', description: '“standard” or one of the classes in Store Settings → Tax.' } },
        { name: 'compound', type: 'checkbox', defaultValue: false, admin: { width: '33%' } },
        { name: 'shipping', label: 'Applies to shipping', type: 'checkbox', defaultValue: true, admin: { width: '33%' } },
      ],
    },
  ],
})

/** Zones are matched top to bottom by `order`; the first zone that matches the address wins. */
export const shippingZonesCollection = (opts: StoreSetupPluginOptions, slugs: ResolvedSlugs): CollectionConfig => ({
  slug: slugs.shippingZones,
  labels: { singular: 'Shipping zone', plural: 'Shipping zones' },
  ...base(opts),
  admin: { ...base(opts).admin, useAsTitle: 'name', defaultColumns: ['name', 'countries', 'order'] },
  defaultSort: 'order',
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', required: true, admin: { width: '70%' } },
        { name: 'order', type: 'number', defaultValue: 0, admin: { width: '30%' } },
      ],
    },
    {
      name: 'countries',
      label: 'Zone regions',
      type: 'select',
      hasMany: true,
      options: COUNTRIES,
      admin: { description: 'Leave empty for “Locations not covered by your other zones”.' },
    },
    { name: 'postcodes', type: 'textarea', admin: { description: 'Optional: limit to postcodes, one per line.' } },
    {
      name: 'methods',
      label: 'Shipping methods',
      type: 'blocks',
      blocks: [
        {
          slug: 'flat_rate',
          labels: { singular: 'Flat rate', plural: 'Flat rates' },
          fields: [
            { name: 'title', type: 'text', defaultValue: 'Flat rate' },
            {
              type: 'row',
              fields: [
                { name: 'cost', type: 'number', min: 0, defaultValue: 0, admin: { width: '33%', description: 'Minor units, e.g. 450 = 4.50.' } },
                { name: 'perItem', label: 'Cost per item', type: 'number', min: 0, admin: { width: '33%' } },
                {
                  name: 'taxStatus',
                  type: 'select',
                  defaultValue: 'taxable',
                  options: [
                    { label: 'Taxable', value: 'taxable' },
                    { label: 'None', value: 'none' },
                  ],
                  admin: { width: '33%' },
                },
              ],
            },
          ],
        },
        {
          slug: 'free_shipping',
          labels: { singular: 'Free shipping', plural: 'Free shipping' },
          fields: [
            { name: 'title', type: 'text', defaultValue: 'Free shipping' },
            {
              type: 'row',
              fields: [
                { name: 'requires', type: 'select', defaultValue: 'none', options: FREE_SHIPPING_REQUIRES, admin: { width: '50%' } },
                { name: 'minAmount', label: 'Minimum order amount', type: 'number', min: 0, admin: { width: '50%' } },
              ],
            },
            { name: 'ignoreDiscounts', label: 'Apply the minimum before coupon discounts', type: 'checkbox', defaultValue: false },
          ],
        },
        {
          slug: 'local_pickup',
          labels: { singular: 'Local pickup', plural: 'Local pickup' },
          fields: [
            { name: 'title', type: 'text', defaultValue: 'Local pickup' },
            { name: 'cost', type: 'number', min: 0, defaultValue: 0 },
            { name: 'instructions', type: 'textarea', admin: { description: 'Where and when to collect.' } },
          ],
        },
      ],
    },
  ],
})

export const couponsCollection = (opts: StoreSetupPluginOptions, slugs: ResolvedSlugs): CollectionConfig => ({
  slug: slugs.coupons,
  labels: { singular: 'Coupon', plural: 'Coupons' },
  ...base(opts),
  admin: { ...base(opts).admin, useAsTitle: 'code', defaultColumns: ['code', 'discountType', 'amount', 'expiresAt', 'usageCount'] },
  hooks: {
    beforeValidate: [({ data }) => (data?.code ? { ...data, code: String(data.code).trim().toLowerCase() } : data)],
  },
  fields: [
    { name: 'code', type: 'text', required: true, unique: true, index: true, admin: { description: 'Codes are case-insensitive.' } },
    { name: 'description', type: 'textarea' },
    {
      type: 'row',
      fields: [
        { name: 'discountType', type: 'select', required: true, defaultValue: 'percent', options: DISCOUNT_TYPES, admin: { width: '50%' } },
        { name: 'amount', type: 'number', required: true, min: 0, admin: { width: '50%', description: 'Percent, or minor units for fixed discounts.' } },
      ],
    },
    { name: 'freeShipping', label: 'Allow free shipping', type: 'checkbox', defaultValue: false },
    { name: 'expiresAt', type: 'date', admin: { date: { pickerAppearance: 'dayOnly' } } },
    {
      type: 'collapsible',
      label: 'Usage restriction',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'minimumSpend', type: 'number', min: 0, admin: { width: '50%' } },
            { name: 'maximumSpend', type: 'number', min: 0, admin: { width: '50%' } },
          ],
        },
        { name: 'individualUse', label: 'Cannot be combined with other coupons', type: 'checkbox', defaultValue: false },
        { name: 'excludeSaleItems', type: 'checkbox', defaultValue: false },
        { name: 'allowedEmails', type: 'text', admin: { description: 'Comma-separated; wildcards like *@club.org allowed.' } },
      ],
    },
    {
      type: 'collapsible',
      label: 'Usage limits',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'usageLimit', label: 'Usage limit per coupon', type: 'number', min: 0, admin: { width: '50%' } },
            { name: 'usageLimitPerUser', label: 'Usage limit per user', type: 'number', min: 0, admin: { width: '50%' } },
          ],
        },
        { name: 'usageCount', type: 'number', defaultValue: 0, admin: { readOnly: true } },
      ],
    },
  ],
})

/** Only added when the host app has no products collection of its own (see `products` option). */
export const productsCollection = (opts: StoreSetupPluginOptions, slugs: ResolvedSlugs): CollectionConfig => ({
  slug: slugs.products,
  labels: { singular: 'Product', plural: 'Products' },
  ...base(opts),
  access: { ...base(opts).access, read: () => true },
  admin: { ...base(opts).admin, useAsTitle: 'name', defaultColumns: ['name', 'type', 'regularPrice', 'stockQuantity', 'status'] },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: { position: 'sidebar' },
      hooks: {
        beforeValidate: [
          ({ value, data }) =>
            value ||
            String(data?.name ?? '')
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, ''),
        ],
      },
    },
    {
      name: 'type',
      type: 'select',
      defaultValue: 'simple',
      options: [
        { label: 'Simple product', value: 'simple' },
        { label: 'Variable product', value: 'variable' },
        { label: 'Grouped product', value: 'grouped' },
        { label: 'External / affiliate product', value: 'external' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      type: 'row',
      fields: [
        { name: 'virtual', type: 'checkbox', admin: { width: '50%' } },
        { name: 'downloadable', type: 'checkbox', admin: { width: '50%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'regularPrice', type: 'number', min: 0, admin: { width: '33%', description: 'Minor units.' } },
        { name: 'salePrice', type: 'number', min: 0, admin: { width: '33%' } },
        { name: 'sku', label: 'SKU', type: 'text', admin: { width: '33%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'manageStock', type: 'checkbox', admin: { width: '33%' } },
        { name: 'stockQuantity', type: 'number', admin: { width: '33%', condition: (_, s) => Boolean(s?.manageStock) } },
        {
          name: 'stockStatus',
          type: 'select',
          defaultValue: 'instock',
          options: [
            { label: 'In stock', value: 'instock' },
            { label: 'Out of stock', value: 'outofstock' },
            { label: 'On backorder', value: 'onbackorder' },
          ],
          admin: { width: '33%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'weight', type: 'number', min: 0, admin: { width: '25%' } },
        { name: 'length', type: 'number', min: 0, admin: { width: '25%' } },
        { name: 'width', type: 'number', min: 0, admin: { width: '25%' } },
        { name: 'height', type: 'number', min: 0, admin: { width: '25%' } },
      ],
    },
    { name: 'shortDescription', type: 'textarea' },
    ...(opts.uploadsCollection ? [{ name: 'image', type: 'upload' as const, relationTo: opts.uploadsCollection as any }] : []),
    {
      name: 'attributes',
      type: 'array',
      admin: { condition: (_, s) => s?.type === 'variable' },
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'values', type: 'text', required: true, admin: { description: 'Separate values with |, e.g. S | M | L' } },
      ],
    },
    {
      type: 'row',
      admin: { condition: (_, s) => s?.type === 'external' },
      fields: [
        { name: 'externalUrl', type: 'text', admin: { width: '70%' } },
        { name: 'buttonText', type: 'text', defaultValue: 'Buy product', admin: { width: '30%' } },
      ],
    },
  ],
})
