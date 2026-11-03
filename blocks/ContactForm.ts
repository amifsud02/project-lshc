import type { Block } from 'payload'

export const ContactFormBlock: Block = {
  slug: 'contactForm',
  interfaceName: 'ContactFormBlock',
  labels: { singular: 'Contact form', plural: 'Contact forms' },
  fields: [
    { name: 'heading', type: 'text', defaultValue: 'Get in touch' },
    {
      name: 'intro',
      type: 'textarea',
      defaultValue: "Questions about the club, the nursery or anything else? Send us a message and we'll get back to you.",
    },
  ],
}
