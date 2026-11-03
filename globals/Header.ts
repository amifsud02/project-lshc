import type { GlobalConfig } from 'payload'
import { link } from '@/lib/utils/payload/link'
import { revalidateGlobal } from './hooks/revalidateGlobal'
import { adminOnly } from '@/lib/auth/roles'

const LABELS = '@/components/admin/MenuRowLabels'

const hasMegaMenu = (_: unknown, siblingData: { enableMegaMenu?: boolean }) => Boolean(siblingData?.enableMegaMenu)

/**
 * The main menu. Modelled on Payload's own site menu: each top item can open a full-width panel
 * with an intro and columns of grouped links.
 */
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
      admin: {
        initCollapsed: true,
        components: { RowLabel: `${LABELS}#MenuLinkRowLabel` },
      },
      fields: [
        link({ appearances: false }),
        {
          name: 'enableMegaMenu',
          type: 'checkbox',
          label: 'Open a menu panel on hover',
        },
        {
          type: 'collapsible',
          label: 'Menu panel',
          admin: { condition: hasMegaMenu },
          fields: [
            {
              name: 'description',
              type: 'textarea',
              admin: { description: 'One or two sentences shown under the section title on the left of the panel.' },
            },
            {
              name: 'descriptionLinks',
              type: 'array',
              label: 'Links under the description',
              labels: { singular: 'Link', plural: 'Links' },
              maxRows: 2,
              admin: { components: { RowLabel: `${LABELS}#LinkRowLabel` } },
              fields: [link({ appearances: false })],
            },
            {
              name: 'columns',
              type: 'array',
              label: 'Link columns',
              labels: { singular: 'Column', plural: 'Columns' },
              maxRows: 3,
              admin: { components: { RowLabel: `${LABELS}#MenuColumnRowLabel` } },
              fields: [
                { name: 'heading', type: 'text', admin: { description: 'Optional, e.g. "Teams".' } },
                {
                  name: 'links',
                  type: 'array',
                  labels: { singular: 'Link', plural: 'Links' },
                  admin: { components: { RowLabel: `${LABELS}#LinkRowLabel` } },
                  fields: [link({ appearances: false })],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'ctaButtons',
      type: 'array',
      label: 'Buttons',
      labels: { singular: 'Button', plural: 'Buttons' },
      maxRows: 2,
      admin: {
        description: 'Up to two buttons at the right of the menu, next to the cart, e.g. "Become a member". Only the first shows in the bar; the mobile menu lists both.',
        components: { RowLabel: `${LABELS}#LinkRowLabel` },
      },
      fields: [link({ appearances: ['default', 'outline'] })],
    },
  ],
}
