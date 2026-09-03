import { slugField, type CollectionConfig, type Field } from 'payload'
import { collectionWriteAccess } from '@/lib/auth/roles'

/** Title and optional lead paragraph for one fixed step of the registration form. */
const sectionCopy = (name: string, defaultTitle: string): Field => ({
  name,
  type: 'group',
  label: defaultTitle,
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'title',
          type: 'text',
          defaultValue: defaultTitle,
          admin: { width: '40%' },
        },
        {
          name: 'description',
          type: 'text',
          admin: { width: '60%', description: 'Short line under the heading. Optional.' },
        },
      ],
    },
  ],
})

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
          label: 'Registration form',
          description:
            'Controls what the online form says and which optional questions it asks. Age groups, fees, payment methods and consents come from the other tabs.',
          fields: [
            {
              name: 'registrationForm',
              type: 'group',
              label: false,
              fields: [
                {
                  name: 'intro',
                  type: 'richText',
                  admin: {
                    description: 'Shown above the form. Leave empty for no introduction.',
                  },
                },
                {
                  name: 'closedMessage',
                  type: 'textarea',
                  admin: {
                    description:
                      'Shown instead of the form when registration is closed. Leave empty for the default message.',
                  },
                },
                {
                  type: 'collapsible',
                  label: 'Section headings',
                  admin: { initCollapsed: true },
                  fields: [
                    {
                      name: 'sections',
                      type: 'group',
                      label: false,
                      fields: [
                        sectionCopy('parent', 'Parent or guardian'),
                        sectionCopy('child', 'Your child'),
                        sectionCopy('group', 'Age group'),
                        sectionCopy('sessions', 'Sessions per week'),
                        sectionCopy('health', 'Emergency contact and health'),
                        sectionCopy('extra', 'A few more questions'),
                        sectionCopy('consents', 'Consents'),
                        sectionCopy('payment', 'Payment'),
                      ],
                    },
                  ],
                },
                {
                  type: 'collapsible',
                  label: 'Optional questions',
                  admin: { initCollapsed: true },
                  fields: [
                    {
                      name: 'fields',
                      type: 'group',
                      label: false,
                      admin: {
                        description:
                          'Name, email, mobile, date of birth, school year and the age group are always asked.',
                      },
                      fields: [
                        {
                          type: 'row',
                          fields: [
                            {
                              name: 'relationship',
                              type: 'checkbox',
                              label: 'Ask relationship to child',
                              defaultValue: true,
                              admin: { width: '50%' },
                            },
                            {
                              name: 'school',
                              type: 'checkbox',
                              label: 'Ask which school',
                              defaultValue: true,
                              admin: { width: '50%' },
                            },
                          ],
                        },
                        {
                          type: 'row',
                          fields: [
                            {
                              name: 'kitSize',
                              type: 'checkbox',
                              label: 'Ask kit size',
                              defaultValue: true,
                              admin: { width: '50%' },
                            },
                            {
                              name: 'kitSizeHint',
                              type: 'text',
                              label: 'Kit size hint',
                              defaultValue: 'e.g. 9–10 years',
                              admin: {
                                width: '50%',
                                condition: (_, siblingData) => Boolean(siblingData?.kitSize),
                              },
                            },
                          ],
                        },
                        {
                          type: 'row',
                          fields: [
                            {
                              name: 'emergencyContact',
                              type: 'checkbox',
                              label: 'Ask for an emergency contact',
                              defaultValue: true,
                              admin: { width: '50%' },
                            },
                            {
                              name: 'emergencyContactRequired',
                              type: 'checkbox',
                              label: 'Emergency contact is required',
                              defaultValue: false,
                              admin: {
                                width: '50%',
                                condition: (_, siblingData) => Boolean(siblingData?.emergencyContact),
                              },
                            },
                          ],
                        },
                        {
                          name: 'medical',
                          type: 'checkbox',
                          label: 'Ask about medical conditions, allergies and medication',
                          defaultValue: true,
                        },
                        {
                          name: 'medicalConsentLabel',
                          type: 'textarea',
                          label: 'Emergency treatment consent',
                          defaultValue:
                            'I consent to my child receiving emergency medical treatment if I cannot be reached.',
                          admin: {
                            description: 'Leave empty to hide the checkbox.',
                            condition: (_, siblingData) => Boolean(siblingData?.medical),
                          },
                        },
                        {
                          type: 'row',
                          fields: [
                            {
                              name: 'notes',
                              type: 'checkbox',
                              label: 'Ask "anything else we should know"',
                              defaultValue: true,
                              admin: { width: '50%' },
                            },
                            {
                              name: 'notesLabel',
                              type: 'text',
                              label: 'Notes question',
                              defaultValue: 'Anything else we should know',
                              admin: {
                                width: '50%',
                                condition: (_, siblingData) => Boolean(siblingData?.notes),
                              },
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
                {
                  name: 'extraQuestions',
                  type: 'array',
                  labels: { singular: 'Extra question', plural: 'Extra questions' },
                  admin: {
                    description:
                      'Season-specific questions asked after the health section. Answers are stored with the registration and shown to staff.',
                    initCollapsed: true,
                  },
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'label',
                          type: 'text',
                          required: true,
                          admin: { width: '50%', description: 'e.g. "Has your child played handball before?"' },
                        },
                        {
                          name: 'type',
                          type: 'select',
                          required: true,
                          defaultValue: 'text',
                          admin: { width: '25%' },
                          options: [
                            { label: 'Short answer', value: 'text' },
                            { label: 'Long answer', value: 'textarea' },
                            { label: 'Choose one', value: 'select' },
                            { label: 'Yes / no', value: 'checkbox' },
                          ],
                        },
                        {
                          name: 'required',
                          type: 'checkbox',
                          defaultValue: false,
                          admin: { width: '25%' },
                        },
                      ],
                    },
                    {
                      name: 'hint',
                      type: 'text',
                      admin: { description: 'Optional help text shown under the question.' },
                    },
                    {
                      name: 'options',
                      type: 'array',
                      labels: { singular: 'Option', plural: 'Options' },
                      admin: { condition: (_, siblingData) => siblingData?.type === 'select' },
                      fields: [{ name: 'label', type: 'text', required: true }],
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'submitLabelCard',
                      type: 'text',
                      label: 'Button when paying by card',
                      defaultValue: 'Continue to payment',
                      admin: { width: '50%' },
                    },
                    {
                      name: 'submitLabelTransfer',
                      type: 'text',
                      label: 'Button when paying by bank transfer',
                      defaultValue: 'Complete registration',
                      admin: { width: '50%' },
                    },
                  ],
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
