import type { CollectionConfig } from 'payload'
import { collectionWriteAccess } from '@/lib/auth/roles'

/**
 * Popups that promote something across the site: memberships, a match, a camp, a sale.
 * Visitors see at most one at a time: the running promotion with the highest priority that
 * targets the page they're on. Each visitor sees a promotion once, then not again for its
 * "hide after closing" days; to show a changed promotion to everyone again, duplicate it.
 */
export const Promotions: CollectionConfig = {
  slug: 'promotions',
  labels: { singular: 'Promotion', plural: 'Promotions' },
  admin: {
    group: 'Marketing',
    useAsTitle: 'name',
    defaultColumns: ['name', 'active', 'startDate', 'endDate', 'priority', 'updatedAt'],
    description:
      'Popups shown to visitors. The running promotion with the highest priority is shown; it never opens on the cart, checkout or account pages, or on the page its button links to.',
  },
  access: {
    create: collectionWriteAccess('promotions'),
    delete: collectionWriteAccess('promotions'),
    read: () => true,
    update: collectionWriteAccess('promotions'),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: { description: 'For the admin and analytics, e.g. "Memberships 2026/27".' },
    },
    { name: 'active', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar' } },
    {
      name: 'startDate',
      label: 'Starts',
      type: 'date',
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' }, description: 'Leave empty to start straight away.' },
    },
    {
      name: 'endDate',
      label: 'Ends',
      type: 'date',
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' }, description: 'Leave empty to run until switched off.' },
    },
    {
      name: 'priority',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', description: 'When several promotions are running, the highest number is shown.' },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            { name: 'badge', type: 'text', admin: { description: 'Small label above the heading, e.g. "Memberships now open". Optional.' } },
            { name: 'heading', type: 'text', required: true },
            { name: 'body', label: 'Text', type: 'textarea' },
            {
              name: 'points',
              label: 'Bullet points',
              type: 'array',
              maxRows: 5,
              labels: { singular: 'Point', plural: 'Points' },
              fields: [{ name: 'text', type: 'text', required: true }],
            },
            {
              name: 'highlight',
              type: 'group',
              admin: { description: 'An optional box above the button, e.g. "4 memberships to choose from" and "from €25".' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'label', type: 'text', admin: { width: '60%' } },
                    { name: 'value', type: 'text', admin: { width: '40%', description: 'Shown large, e.g. "€25".' } },
                  ],
                },
                { name: 'valueCaption', label: 'Small text above the value', type: 'text', admin: { description: 'e.g. "from".' } },
              ],
            },
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              admin: { description: 'Shown beside the text on larger screens (a portrait photo works best). Leave empty for a text-only popup.' },
            },
            {
              type: 'row',
              fields: [
                { name: 'ctaLabel', label: 'Button label', type: 'text', required: true, admin: { width: '40%' } },
                {
                  name: 'ctaLink',
                  label: 'Button link',
                  type: 'text',
                  required: true,
                  admin: { width: '60%', description: 'A page on the site (/membership) or a full web address.' },
                },
              ],
            },
            { name: 'footnote', type: 'text', admin: { description: 'Small print under the button. Optional.' } },
          ],
        },
        {
          label: 'Display',
          fields: [
            {
              name: 'showOn',
              label: 'Show on',
              type: 'radio',
              defaultValue: 'all',
              options: [
                { label: 'All pages', value: 'all' },
                { label: 'Only these pages', value: 'only' },
                { label: 'All pages except these', value: 'except' },
              ],
              admin: { layout: 'horizontal' },
            },
            {
              name: 'paths',
              label: 'Pages',
              type: 'array',
              labels: { singular: 'Page', plural: 'Pages' },
              admin: {
                condition: (_, siblingData) => siblingData?.showOn && siblingData.showOn !== 'all',
                description: 'Addresses on this site, e.g. / for the home page, /news, or /news/* for every news post.',
              },
              fields: [{ name: 'path', type: 'text', required: true }],
            },
            {
              type: 'row',
              fields: [
                { name: 'delaySeconds', label: 'Open after (seconds)', type: 'number', defaultValue: 6, min: 0, max: 120 },
                {
                  name: 'snoozeDays',
                  label: 'Hide after closing (days)',
                  type: 'number',
                  defaultValue: 14,
                  min: 1,
                  max: 365,
                  admin: { description: 'How long it stays hidden for a visitor who closes it or clicks the button.' },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
