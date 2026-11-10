import { slugField, type CollectionConfig } from 'payload'
import { collectionWriteAccess } from '@/lib/auth/roles'
import { isChoice } from '@/lib/shop/units'
import { checkMembrsPlan } from './hooks/checkMembrsPlan'
import { productVariants } from './hooks/productVariants'

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
  hooks: {
    beforeChange: [productVariants, checkMembrsPlan],
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
      name: 'stock',
      type: 'number',
      min: 0,
      admin: {
        position: 'sidebar',
        condition: (_, siblingData) => siblingData?.type !== 'membership' && !(siblingData?.variants?.length > 0),
        description: "How many are left. Leave empty if you don't track stock, or track it per variant or per size below.",
      },
    },
    {
      name: 'preorder',
      type: 'group',
      admin: { position: 'sidebar', condition: (_, siblingData) => siblingData?.type !== 'membership' },
      fields: [
        {
          name: 'enabled',
          label: 'Take pre-orders',
          type: 'checkbox',
          admin: { description: 'Lets people order while out of stock.' },
        },
        {
          name: 'dispatchDate',
          label: 'Expected by',
          type: 'date',
          admin: { condition: (_, siblingData) => Boolean(siblingData?.enabled), date: { pickerAppearance: 'dayOnly' } },
        },
      ],
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
          'Each member covered is asked for their name, mobile number and email at checkout. Anything in "Included products" is added to the order alongside the membership.',
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
        {
          name: 'membrsPlanId',
          label: 'Rypple plan ID',
          type: 'number',
          admin: {
            description:
              'The Rypple plan this membership is sold as. Payment is taken by Rypple and each member gets a Rypple account and digital card. An active membership is checked against the plan on save: price and members covered must match, and any size question on an included product must only offer sizes Rypple has. Products included with the plan that nothing here asks about get a picker per member.',
          },
        },
      ],
    },
    { name: 'image', type: 'upload', relationTo: 'media' },
    {
      name: 'gallery',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      admin: { description: 'More photos (back, on-body, details), shown as thumbnails under the main image.' },
    },
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
          type: 'row',
          admin: { condition: (_, siblingData) => siblingData?.kind === 'text' },
          fields: [
            {
              name: 'maxLength',
              label: 'Most characters',
              type: 'number',
              min: 1,
              admin: { width: '33%', description: 'e.g. 12 for a name on a shirt.' },
            },
            {
              name: 'surcharge',
              label: 'Extra charge (cents)',
              type: 'number',
              min: 0,
              admin: { width: '33%', description: 'Added when filled in, e.g. 500 = €5.00 for printing.' },
            },
            {
              name: 'personalised',
              label: 'Printed on the item',
              type: 'checkbox',
              admin: { width: '33%', description: "Asked on the product page; the item can't be returned." },
            },
          ],
        },
        {
          name: 'options',
          type: 'array',
          admin: { condition: (_, siblingData) => siblingData?.kind === 'select' },
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'value', type: 'text', required: true, admin: { width: '33%' } },
                { name: 'label', type: 'text', required: true, admin: { width: '33%' } },
                {
                  name: 'stock',
                  type: 'number',
                  min: 0,
                  admin: { width: '33%', description: "Left in stock. Empty if you don't track it." },
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Variants',
      admin: {
        initCollapsed: true,
        condition: (_, siblingData) => siblingData?.type === 'single',
        description:
          'Sell the product in several versions, e.g. sizes and colours, each with its own SKU, price, stock and photo. Buyers pick one on the product page.',
      },
      fields: [
        {
          name: 'variantOptions',
          label: 'Options',
          type: 'array',
          maxRows: 3,
          labels: { singular: 'Option', plural: 'Options' },
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'name', type: 'text', required: true, admin: { width: '30%', placeholder: 'e.g. Size' } },
                {
                  name: 'values',
                  type: 'text',
                  hasMany: true,
                  required: true,
                  admin: { width: '70%', description: 'Type a value and press Enter, e.g. S, M, L. Shown to buyers in this order.' },
                },
              ],
            },
          ],
        },
        {
          name: 'generateVariants',
          label: 'Create any missing variants when saving',
          type: 'checkbox',
          admin: { description: 'Adds a row for every combination of the options above that is not listed yet.' },
        },
        {
          name: 'variants',
          type: 'array',
          labels: { singular: 'Variant', plural: 'Variants' },
          admin: {
            components: { RowLabel: '@/components/admin/VariantRowLabel#VariantRowLabel' },
            description: 'One row per version sold. Untick Active to stop selling one without losing its stock count.',
          },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'option1',
                  label: 'Option 1',
                  type: 'text',
                  admin: {
                    width: '33%',
                    condition: (data) => (data?.variantOptions?.length ?? 0) >= 1,
                    description: "Value of the product's option 1, e.g. M",
                  },
                },
                {
                  name: 'option2',
                  label: 'Option 2',
                  type: 'text',
                  admin: {
                    width: '33%',
                    condition: (data) => (data?.variantOptions?.length ?? 0) >= 2,
                    description: "Value of the product's option 2, e.g. M",
                  },
                },
                {
                  name: 'option3',
                  label: 'Option 3',
                  type: 'text',
                  admin: {
                    width: '33%',
                    condition: (data) => (data?.variantOptions?.length ?? 0) >= 3,
                    description: "Value of the product's option 3, e.g. M",
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'sku', label: 'SKU', type: 'text', admin: { width: '33%' } },
                {
                  name: 'price',
                  type: 'number',
                  min: 0,
                  admin: { width: '33%', description: 'Cents. Leave empty to use the product price.' },
                },
                {
                  name: 'stock',
                  type: 'number',
                  min: 0,
                  admin: { width: '33%', description: "Left in stock. Empty if you don't track it." },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'image', type: 'upload', relationTo: 'media', admin: { width: '66%', description: 'Shown when this variant is picked.' } },
                { name: 'active', type: 'checkbox', defaultValue: true, admin: { width: '33%' } },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'bundleItems',
      type: 'array',
      label: 'Included products',
      labels: { singular: 'Included product', plural: 'Included products' },
      admin: {
        description:
          'Products that make up this bundle, or that come with this membership. On a membership a row can instead be a choice, e.g. a T-shirt or a hoodie: each member picks one when buying.',
        condition: (_, siblingData) => siblingData?.type === 'bundle' || siblingData?.type === 'membership',
      },
      fields: [
        {
          name: 'kind',
          label: 'Includes',
          type: 'radio',
          defaultValue: 'product',
          options: [
            { label: 'A product', value: 'product' },
            { label: 'A choice of products', value: 'choice' },
          ],
          admin: {
            layout: 'horizontal',
            // Choices are picked on the membership form; bundles go through the cart, which has no picker.
            condition: (data) => data?.type === 'membership',
          },
        },
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
          required: true,
          filterOptions: () => ({ type: { equals: 'single' } }),
          admin: { condition: (data, siblingData) => !isChoice(data?.type, siblingData) },
        },
        {
          name: 'choices',
          label: 'Products to choose from',
          type: 'relationship',
          relationTo: 'products',
          hasMany: true,
          required: true,
          minRows: 2,
          filterOptions: () => ({ type: { equals: 'single' } }),
          admin: {
            condition: (data, siblingData) => isChoice(data?.type, siblingData),
            description: 'Each member picks one of these, then answers its own questions (e.g. a size).',
          },
        },
        {
          name: 'label',
          label: 'Heading',
          type: 'text',
          admin: {
            condition: (data, siblingData) => isChoice(data?.type, siblingData),
            placeholder: 'e.g. Choose your merchandise',
            description: 'Shown above the choice on the membership form. Leave empty to list the products.',
          },
        },
        {
          name: 'quantity',
          type: 'number',
          required: true,
          defaultValue: 1,
          min: 1,
          admin: { description: 'On a membership, one per member covered (e.g. 2 on a couple membership).' },
        },
      ],
    },
  ],
}
