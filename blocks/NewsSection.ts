import type { Block } from 'payload'

export const NewsSectionBlock: Block = {
  slug: 'newsSection',
  interfaceName: 'NewsSectionBlock',
  labels: {
    singular: 'News Section',
    plural: 'News Sections',
  },
  fields: [
    { name: 'heading', type: 'text', defaultValue: 'Latest News' },
    {
      name: 'layout',
      type: 'select',
      defaultValue: 'grid',
      options: [
        { label: 'Grid', value: 'grid' },
        { label: 'List', value: 'list' },
        { label: 'Featured + Grid', value: 'featured' },
      ],
    },
    { name: 'limit', type: 'number', defaultValue: 6, min: 1, max: 24 },
    {
      name: 'tags',
      type: 'array',
      admin: { description: 'Only show posts matching any of these tags. Leave empty for all.' },
      fields: [{ name: 'tag', type: 'text', required: true }],
    },
    {
      name: 'showViewAll',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Show a "View all news" link.' },
    },
  ],
}
