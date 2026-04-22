import type { Block } from 'payload'

export const JoinUsBlock: Block = {
  slug: 'joinUs',
  interfaceName: 'JoinUsBlock',
  labels: {
    singular: 'Join Us CTA',
    plural: 'Join Us CTAs',
  },
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'body', type: 'textarea' },
    { name: 'ctaLabel', type: 'text', defaultValue: 'Join Us' },
    { name: 'ctaLink', type: 'text', defaultValue: '/contact' },
    { name: 'backgroundImage', type: 'upload', relationTo: 'media' },
  ],
}
