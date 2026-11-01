import type { Block } from 'payload'

const link = (name: string, label: string) => ({
  name,
  type: 'group' as const,
  label,
  fields: [
    {
      type: 'row' as const,
      fields: [
        { name: 'label', type: 'text' as const, admin: { width: '50%' } },
        { name: 'url', type: 'text' as const, admin: { width: '50%', description: 'e.g. /academy or https://…' } },
      ],
    },
  ],
})

export const CtaBannerBlock: Block = {
  slug: 'ctaBanner',
  interfaceName: 'CtaBannerBlock',
  labels: { singular: 'Call to action', plural: 'Calls to action' },
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'body', type: 'textarea' },
    link('primary', 'Main button'),
    link('secondary', 'Second button'),
    {
      name: 'tone',
      type: 'select',
      defaultValue: 'navy',
      options: [
        { label: 'Club navy', value: 'navy' },
        { label: 'Light', value: 'light' },
      ],
    },
  ],
}
