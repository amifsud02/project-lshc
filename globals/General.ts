import { GlobalConfig } from "payload";
import { revalidateGlobal } from "./hooks/revalidateGlobal";
import { adminOnly } from '@/lib/auth/roles'

export const General: GlobalConfig = {
    slug: 'general',
    access: {
        read: ({ req: { user } }) => !!user,
      update: adminOnly,
    },
    admin: {
        group: 'Theme Settings'
    },
    fields: [
        {
            type: 'tabs',
            tabs: [
                {
                    label: 'Site Settings',
                    name: 'general',
                    fields: [
                        {
                            name: 'name',
                            label: 'Site Name',
                            type: 'text',
                            required: true,
                        },
                        {
                            name: 'description',
                            label: 'Site Description',
                            type: 'text',
                            required: true,
                        },
                        {
                            name: 'logo',
                            label: 'Logo',
                            type: 'upload',
                            relationTo: 'media',
                        },
                        {
                            name: 'favicon',
                            label: 'Favicon',
                            type: 'upload',
                            relationTo: 'media',
                        },
                        {
                            name: 'fallbackImage',
                            label: 'Fallback Image',
                            type: 'upload',
                            relationTo: 'media',
                        }
                    ]
                },
                {
                    label: 'Reading',
                    name: 'reading',
                    fields: [
                        {
                            name: 'postsPerPage',
                            label: 'Blog Pages show at most',
                            type: 'number',
                            defaultValue: 10,
                            min: 1,
                            admin: {
                                description: 'Enter the number of posts to show per page.',
                            },
                        },
                    ]
                },
                {
                    label: 'Shop',
                    name: 'shop',
                    description: 'These settings only affect the e-commerce shop. The rest of the site is always public.',
                    fields: [
                        {
                            name: 'visibility',
                            label: 'Shop visibility',
                            type: 'radio',
                            defaultValue: 'admins',
                            required: true,
                            options: [
                                {
                                    label: 'Admins only — the shop and its pages (shop, cart, checkout, orders) are hidden from visitors and only admins can view them.',
                                    value: 'admins',
                                },
                                {
                                    label: 'Public — the shop is visible to everyone.',
                                    value: 'public',
                                },
                            ],
                            admin: {
                                layout: 'vertical',
                                description: 'Controls who can see the e-commerce shop. Takes effect within a minute of saving.',
                            },
                        },
                    ]
                }
            ]
        }
    ],
    hooks: {
        afterChange: [revalidateGlobal('global:general')]
    }
}
