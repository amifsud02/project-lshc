import type { Block } from 'payload'

export const RichTextBlock: Block = {
  slug: 'richText',
  interfaceName: 'RichTextBlock',
  labels: {
    singular: 'Rich Text',
    plural: 'Rich Text Blocks',
  },
  admin: {
    images: {
      thumbnail: { url: '/blocks/richtext.webp', alt: 'Heading and paragraphs of formatted text' },
    },
  },
  fields: [
    { name: 'content', type: 'richText', required: true },
    {
      name: 'width',
      type: 'select',
      defaultValue: 'prose',
      options: [
        { label: 'Prose (narrow)', value: 'prose' },
        { label: 'Full width', value: 'full' },
      ],
    },
  ],
}
