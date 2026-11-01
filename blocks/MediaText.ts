import type { Block } from 'payload'

export const MediaTextBlock: Block = {
  slug: 'mediaText',
  interfaceName: 'MediaTextBlock',
  labels: { singular: 'Image and text', plural: 'Image and text' },
  fields: [
    { name: 'eyebrow', type: 'text' },
    { name: 'heading', type: 'text', required: true },
    { name: 'body', type: 'richText', required: true },
    { name: 'image', type: 'upload', relationTo: 'media', admin: { description: 'Optional. Without one, the text spans the page.' } },
    {
      name: 'imagePosition',
      type: 'radio',
      defaultValue: 'right',
      options: [
        { label: 'Image on the right', value: 'right' },
        { label: 'Image on the left', value: 'left' },
      ],
      admin: { layout: 'horizontal', condition: (_, sibling) => Boolean(sibling?.image) },
    },
    {
      type: 'row',
      fields: [
        { name: 'linkLabel', type: 'text', admin: { width: '50%' } },
        { name: 'linkUrl', type: 'text', admin: { width: '50%' } },
      ],
    },
  ],
}
