import type { GlobalConfig } from 'payload'
import { link } from '@/lib/utils/payload/link'
import { revalidateGlobal } from './hooks/revalidateGlobal'
import { adminOnly } from '@/lib/auth/roles'

export const Header: GlobalConfig = {
  slug: 'header',
  label: 'Header',
  admin: {
    group: 'Global Settings',
  },
  access: {
    read: () => true,
    update: adminOnly,
  },
  hooks: {
    afterChange: [revalidateGlobal('global:header')],
  },
  fields: [
    {
      name: 'menuLinks',
      label: 'Menu Links',
      labels: { singular: 'Menu Link', plural: 'Menu Links' },
      type: 'array',
      fields: [
        link({ appearances: false }),
        {
          name: 'dropdown',
          type: 'array',
          labels: { singular: 'Dropdown Link', plural: 'Dropdown Links' },
          admin: {
            description:
              'Optional sub-links shown on hover. Dropdowns cannot nest further — max depth is two.',
          },
          fields: [link({ appearances: false })],
        },
      ],
    },
  ],
}
