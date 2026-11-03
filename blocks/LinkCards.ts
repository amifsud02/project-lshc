import type { Block } from 'payload'

export const LinkCardsBlock: Block = {
  slug: 'linkCards',
  interfaceName: 'LinkCardsBlock',
  labels: { singular: 'Link cards', plural: 'Link cards' },
  fields: [
    { name: 'heading', type: 'text', admin: { description: 'Optional heading above the cards.' } },
    { name: 'intro', type: 'textarea', admin: { description: 'Optional paragraph above the cards.' } },
    {
      name: 'cards',
      type: 'array',
      minRows: 1,
      maxRows: 6,
      labels: { singular: 'Card', plural: 'Cards' },
      fields: [
        { name: 'eyebrow', type: 'text', admin: { description: 'Small label above the title, e.g. "Ages 5–16".' } },
        { name: 'title', type: 'text', required: true },
        { name: 'text', type: 'textarea' },
        { name: 'url', label: 'Link', type: 'text', required: true, admin: { description: 'e.g. /academy or https://…' } },
      ],
    },
  ],
}
