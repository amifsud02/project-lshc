import { slugField, type CollectionConfig } from 'payload'
import { collectionWriteAccess } from '@/lib/auth/roles'

/**
 * Everything the twice-yearly parents' letter says that is not a training slot:
 * the copy, the fees, the rebate paragraph, the kit rules and the contact.
 *
 * The public `/nursery` page and the registration form both read the season
 * marked active, so publishing next season is editing this record rather than
 * rewriting a document and a web page that then drift apart.
 */
export const NurserySeasons: CollectionConfig = {
  slug: 'nursery-seasons',
  labels: { singular: 'Nursery Season', plural: 'Nursery Seasons' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'isActive', 'registrationOpensAt', 'registrationClosesAt'],
    group: 'Nursery',
  },
  access: {
    create: collectionWriteAccess('nursery-seasons'),
    delete: collectionWriteAccess('nursery-seasons'),
    read: () => true,
    update: collectionWriteAccess('nursery-seasons'),
  },
  hooks: {
    afterChange: [
      // Exactly one season may be active. Ticking a new one stands the old one
      // down rather than leaving the front end to guess between two.
      async ({ doc, req, operation }) => {
        if (!doc?.isActive) return
        if (operation !== 'create' && operation !== 'update') return
        const { docs } = await req.payload.find({
          collection: 'nursery-seasons',
          where: { and: [{ isActive: { equals: true } }, { id: { not_equals: doc.id } }] },
          limit: 50,
          req,
        })
        for (const stale of docs) {
          await req.payload.update({
            collection: 'nursery-seasons',
            id: stale.id,
            data: { isActive: false },
            req,
          })
        }
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: { description: 'e.g. "2026/2027"' },
    },
    slugField({
      name: 'slug',
      required: true,
      position: 'sidebar',
      useAsSlug: 'title',
    }),
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'The season shown on /nursery and open on the registration form.',
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Dates',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'registrationOpensAt',
                  type: 'date',
                  admin: { width: '50%', description: 'Leave empty to open immediately.' },
                },
                {
                  name: 'registrationClosesAt',
                  type: 'date',
                  admin: { width: '50%', description: 'Leave empty to stay open.' },
                },
              ],
            },
            {
              name: 'firstTrainingDate',
              type: 'date',
              admin: {
                description:
                  'The Monday training starts. Shown as "the week beginning Monday …".',
              },
            },
          ],
        },
        {
          label: 'Letter copy',
          fields: [
            {
              name: 'introduction',
              type: 'richText',
              admin: { description: 'The opening paragraphs addressed to parents.' },
            },
            {
              name: 'attendanceNote',
              type: 'richText',
              label: 'Regular attendance matters',
            },
            {
              name: 'festivalNote',
              type: 'richText',
              admin: { description: 'Shown once under the full schedule.' },
            },
            {
              name: 'trainingAttire',
              type: 'richText',
            },
            {
              name: 'closingNote',
              type: 'richText',
              admin: { description: 'The sign-off, above the contact details.' },
            },
          ],
        },
        {
          label: 'Fees',
          fields: [
            {
              name: 'feeTiers',
              type: 'array',
              required: true,
              minRows: 1,
              labels: { singular: 'Fee tier', plural: 'Fee tiers' },
              admin: {
                description:
                  'A group is offered every tier between its own minimum and the number of sessions it actually runs.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'value',
                      type: 'text',
                      required: true,
                      admin: { width: '30%', description: 'Machine key, e.g. two-sessions' },
                    },
                    {
                      name: 'label',
                      type: 'text',
                      required: true,
                      admin: { width: '40%', description: 'e.g. "2 training sessions per week"' },
                    },
                    {
                      name: 'sessionsPerWeek',
                      type: 'number',
                      required: true,
                      min: 1,
                      admin: { width: '30%' },
                    },
                  ],
                },
                {
                  name: 'priceCents',
                  type: 'number',
                  required: true,
                  min: 0,
                  admin: { description: 'Price in cents for the whole season (18000 = €180.00).' },
                },
              ],
            },
            {
              name: 'taxRebate',
              type: 'group',
              fields: [
                { name: 'enabled', type: 'checkbox', defaultValue: true },
                {
                  name: 'copy',
                  type: 'richText',
                  admin: { condition: (_, siblingData) => Boolean(siblingData?.enabled) },
                },
                {
                  name: 'consentLabel',
                  type: 'textarea',
                  defaultValue:
                    'I authorise La Salle Handball Club to process the tax rebate documentation on my behalf.',
                  admin: { condition: (_, siblingData) => Boolean(siblingData?.enabled) },
                },
              ],
            },
          ],
        },
        {
          label: 'Payment',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'allowCardPayment',
                  type: 'checkbox',
                  defaultValue: true,
                  admin: { width: '50%', description: 'Pay now by card through Stripe.' },
                },
                {
                  name: 'allowBankTransfer',
                  type: 'checkbox',
                  defaultValue: true,
                  admin: { width: '50%', description: 'Register now, transfer the fee after.' },
                },
              ],
            },
            {
              name: 'bankTransfer',
              type: 'group',
              admin: { condition: (data) => Boolean(data?.allowBankTransfer) },
              fields: [
                { name: 'accountName', type: 'text' },
                {
                  type: 'row',
                  fields: [
                    { name: 'iban', label: 'IBAN', type: 'text', admin: { width: '60%' } },
                    { name: 'swift', label: 'BIC / SWIFT', type: 'text', admin: { width: '40%' } },
                  ],
                },
                {
                  name: 'instructions',
                  type: 'textarea',
                  admin: {
                    description:
                      'Shown on the confirmation page and in the email, under the account details.',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Contact & privacy',
          fields: [
            {
              name: 'contact',
              type: 'group',
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'name', type: 'text', admin: { width: '40%' } },
                    { name: 'phone', type: 'text', admin: { width: '30%' } },
                    { name: 'email', type: 'email', admin: { width: '30%' } },
                  ],
                },
              ],
            },
            {
              name: 'privacyNotice',
              type: 'richText',
              admin: {
                description:
                  'Shown on the registration form. Covers what is collected about the child, why, and how long it is kept.',
              },
            },
            {
              name: 'privacyConsentLabel',
              type: 'textarea',
              defaultValue:
                'I have read the privacy notice and consent to the Club processing my child’s data for the purpose of running the nursery.',
            },
            {
              name: 'photoConsentLabel',
              type: 'textarea',
              defaultValue:
                'I consent to photographs and video of my child taken at Club activities being used on the Club’s website and social media.',
            },
          ],
        },
      ],
    },
  ],
}
