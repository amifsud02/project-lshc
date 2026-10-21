import type { CollectionConfig } from 'payload'
import { collectionWriteAccess, isStaff } from '@/lib/auth/roles'

export const AD_FORMATS = [
  { label: 'Wide banner (1200 × 200)', value: 'banner' },
  { label: 'Rectangle (600 × 500)', value: 'rectangle' },
] as const

export type AdFormatValue = (typeof AD_FORMATS)[number]['value']

const isHttpUrl = (value: unknown) => {
  if (typeof value !== 'string') return false
  try {
    const { protocol } = new URL(value)
    return protocol === 'https:' || protocol === 'http:'
  } catch {
    return false
  }
}

/**
 * Ad space the club sells directly. An ad shows wherever a page has an Advertisement block
 * for its format (or picks it by name), but only while it is active and inside its dates.
 * Clicks go through /api/ads/<id>/click, which counts them for the advertiser's report.
 */
export const Advertisements: CollectionConfig = {
  slug: 'advertisements',
  labels: { singular: 'Advertisement', plural: 'Advertisements' },
  admin: {
    group: 'Advertising',
    useAsTitle: 'name',
    defaultColumns: ['name', 'advertiser', 'format', 'active', 'startDate', 'endDate', 'clicks'],
    description:
      'Ads sold directly to advertisers. Place them on pages with the Advertisement block. Recommended image sizes are in the format names; upload at twice the size for sharp screens.',
  },
  access: {
    create: collectionWriteAccess('advertisements'),
    delete: collectionWriteAccess('advertisements'),
    read: () => true,
    update: collectionWriteAccess('advertisements'),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: { description: 'For the admin only, e.g. "Joe’s Bakery — spring 2027".' },
    },
    { name: 'advertiser', type: 'text', admin: { description: 'The business that bought the space.' } },
    {
      name: 'format',
      type: 'select',
      required: true,
      defaultValue: 'banner',
      options: [...AD_FORMATS],
      admin: { position: 'sidebar' },
    },
    { name: 'active', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
    {
      name: 'startDate',
      label: 'Starts',
      type: 'date',
      admin: { position: 'sidebar', description: 'Leave empty to start straight away.' },
    },
    {
      name: 'endDate',
      label: 'Ends',
      type: 'date',
      admin: { position: 'sidebar', description: 'Leave empty to run until switched off.' },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'mobileImage',
      label: 'Phone image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        condition: (_, siblingData) => siblingData?.format === 'banner',
        description: 'Optional. A taller version (600 × 300) for phones, where a wide banner is too small to read.',
      },
    },
    {
      name: 'alt',
      label: 'Image description',
      type: 'text',
      required: true,
      admin: { description: 'What the ad says, for screen readers, e.g. "Joe’s Bakery — 20% off for members".' },
    },
    {
      name: 'link',
      type: 'text',
      required: true,
      validate: (value: unknown) => isHttpUrl(value) || 'Enter a full web address, starting with https://',
      admin: { description: 'The advertiser’s page. Opens in a new tab.' },
    },
    {
      name: 'clicks',
      type: 'number',
      defaultValue: 0,
      access: {
        read: ({ req: { user } }) => isStaff(user),
        create: () => false,
        update: () => false,
      },
      admin: { position: 'sidebar', readOnly: true, description: 'Counted automatically.' },
    },
  ],
}
