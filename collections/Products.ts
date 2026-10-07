import { slugField, type CollectionConfig } from 'payload'
import { collectionWriteAccess } from '@/lib/auth/roles'

export const Products: CollectionConfig = {
  slug: 'products',
  labels: { singular: 'Product', plural: 'Products' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'price', 'active', 'updatedAt'],
  },
  access: {
    create: collectionWriteAccess('products'),
    delete: collectionWriteAccess('products'),
    read: () => true,
    update: collectionWriteAccess('products'),
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField({
      name: 'slug',
      required: true,
      position: 'sidebar',
      useAsSlug: 'title',
    }),
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'single',
      options: [
        { label: 'Single product', value: 'single' },
        { label: 'Bundle', value: 'bundle' },
        { label: 'Membership', value: 'membership' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'price',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description:
          'Price in cents (e.g. 2500 = €25.00). For bundles and memberships this is the price the customer pays for everything included.',
      },
    },
    {
      name: 'membership',
      type: 'group',
      admin: {
        condition: (_, siblingData) => siblingData?.type === 'membership',
        description:
          'Each member covered is asked for their name and mobile number at checkout. Anything in "Included products" is added to the order alongside the membership.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'season',
              type: 'text',
              admin: { width: '50%', description: 'e.g. "2026/2027"' },
              validate: (value: unknown, { data }: { data: Partial<{ type: string }> }) =>
                data?.type !== 'membership' || Boolean(value) || 'A membership needs a season.',
            },
            {
              name: 'membersCovered',
              type: 'number',
              defaultValue: 1,
              min: 1,
              max: 6,
              admin: { width: '50%', description: '1 for a single membership, 2 for a couple.' },
            },
          ],
        },
      ],
    },
    { name: 'image', type: 'upload', relationTo: 'media' },
    { name: 'description', type: 'richText' },
    {
      name: 'customFields',
      type: 'array',
      admin: {
        description:
          'Information the customer must fill in per unit. On single products, one set per product unit. On bundles, one set per bundle unit (asked in addition to each child product\'s own fields).',
      },
      fields: [
        { name: 'name', type: 'text', required: true, admin: { description: 'Machine key, e.g. firstName' } },
        { name: 'label', type: 'text', required: true },
        {
          name: 'kind',
          type: 'select',
          required: true,
          defaultValue: 'text',
          options: [
            { label: 'Text', value: 'text' },
            { label: 'Email', value: 'email' },
            { label: 'Phone', value: 'phone' },
            { label: 'Select', value: 'select' },
          ],
        },
        { name: 'required', type: 'checkbox', defaultValue: true },
        {
          name: 'options',
          type: 'array',
          admin: { condition: (_, siblingData) => siblingData?.kind === 'select' },
          fields: [
            { name: 'value', type: 'text', required: true },
            { name: 'label', type: 'text', required: true },
          ],
        },
      ],
    },
    {
      name: 'bundleItems',
      type: 'array',
      label: 'Included products',
      admin: {
        description: 'Products that make up this bundle, or that come with this membership.',
        condition: (_, siblingData) => siblingData?.type === 'bundle' || siblingData?.type === 'membership',
      },
      fields: [
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
          required: true,
          filterOptions: () => ({ type: { equals: 'single' } }),
        },
        { name: 'quantity', type: 'number', required: true, defaultValue: 1, min: 1 },
      ],
    },
  ],
}
