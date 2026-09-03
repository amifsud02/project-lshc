import type { GlobalConfig } from 'payload'
import { link } from '@/lib/utils/payload/link'
import { revalidateGlobal } from './hooks/revalidateGlobal'
import { adminOnly } from '@/lib/auth/roles'

export const Footer: GlobalConfig = {
  slug: 'footer',
  label: 'Footer',
  admin: {
    group: 'Global Settings',
  },
  access: {
    read: () => true,
    update: adminOnly,
  },
  hooks: {
    afterChange: [revalidateGlobal('global:footer')],
  },
  fields: [
    {
      name: 'clubName',
      type: 'text',
      admin: { description: 'Displayed as the footer heading.' },
    },
    {
      name: 'tagline',
      type: 'text',
      admin: { description: 'Short sentence shown beneath the club name.' },
    },
    {
      name: 'menuLinks',
      label: 'Menu Links',
      labels: { singular: 'Menu Link', plural: 'Menu Links' },
      type: 'array',
      admin: {
        description:
          'Optional nav links rendered in the footer. Flat list — no dropdowns in the footer.',
      },
      fields: [link({ appearances: false })],
    },
    {
      name: 'social',
      type: 'group',
      fields: [
        { name: 'facebook', type: 'text' },
        { name: 'instagram', type: 'text' },
        { name: 'tiktok', type: 'text' },
      ],
    },
    {
      name: 'contact',
      type: 'group',
      fields: [
        { name: 'email', type: 'email' },
        { name: 'phone', type: 'text' },
      ],
    },
    {
      name: 'copyright',
      type: 'text',
      admin: {
        description:
          'Copyright line shown in the sub-footer. Use {year} as a placeholder (e.g. "© {year} - La Salle Handball Club").',
      },
    },
  ],
}
