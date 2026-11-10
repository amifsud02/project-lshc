import type { Block } from 'payload'

export const MemberBenefitsBlock: Block = {
  slug: 'memberBenefits',
  interfaceName: 'MemberBenefitsBlock',
  labels: { singular: 'Member benefits', plural: 'Member benefits' },
  fields: [
    {
      name: 'heading',
      type: 'text',
      admin: { description: 'Leave empty for "Discounts at N partner businesses". The partners themselves come from Rypple.' },
    },
    {
      name: 'intro',
      type: 'textarea',
      defaultValue:
        'Show your digital membership card at the till to get your discount. Some partners give members a code to use online instead.',
    },
    {
      name: 'emptyText',
      type: 'text',
      label: 'Text when there are no partners yet',
      defaultValue: 'Partner discounts for this season will be announced soon.',
    },
  ],
}
