import { slugField, type CollectionConfig } from 'payload'

export const Products: CollectionConfig = {
  slug: 'products',
  labels: { singular: 'Product', plural: 'Products' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'price', 'active', 'updatedAt'],
  },
  access: {
    read: () => true,
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
          'Price in cents (e.g. 2500 = €25.00). For bundles this is the bundle price the customer pays.',
      },
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
      admin: {
        description: 'Products that make up this bundle.',
        condition: (_, siblingData) => siblingData?.type === 'bundle',
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
