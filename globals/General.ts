import { GlobalConfig } from "payload";
import { revalidateGlobal } from "./hooks/revalidateGlobal";
import { adminOnly } from '@/lib/auth/roles'

export const General: GlobalConfig = {
    slug: 'general',
    label: 'Site Settings',
    access: {
        read: ({ req: { user } }) => !!user,
      update: adminOnly,
    },
    admin: {
        group: 'Global Settings',
        description: 'Site-wide settings for the public website. Changes appear on the site within a minute of saving.',
    },
    fields: [
        {
            type: 'tabs',
            tabs: [
                {
                    label: 'General',
                    name: 'general',
                    fields: [
                        {
                            name: 'name',
                            label: 'Site Name',
                            type: 'text',
                            required: true,
                            admin: {
                                description: 'Added after every page title in browser tabs and search results, e.g. "Contact us | La Salle Handball".',
                            },
                        },
                        {
                            name: 'description',
                            label: 'Site Description',
                            type: 'textarea',
                            required: true,
                            admin: {
                                description: 'Shown by search engines and social media for pages that have no description of their own. Aim for one or two sentences.',
                            },
                        },
                        {
                            name: 'logo',
                            label: 'Logo',
                            type: 'upload',
                            relationTo: 'media',
                            admin: {
                                description: 'Shown in the site header. Leave empty to use the club crest.',
                            },
                        },
                        {
                            name: 'favicon',
                            label: 'Favicon',
                            type: 'upload',
                            relationTo: 'media',
                            admin: {
                                description: 'The icon in the browser tab. Use a square PNG of at least 48 × 48 pixels. Leave empty to use the default icon.',
                            },
                        },
                        {
                            name: 'fallbackImage',
                            label: 'Fallback Image',
                            type: 'upload',
                            relationTo: 'media',
                            admin: {
                                description: 'Used when a news post, gallery or product has no image, and as the picture when a page is shared on social media.',
                            },
                        }
                    ]
                },
                {
                    label: 'Reading',
                    name: 'reading',
                    fields: [
                        {
                            name: 'postsPerPage',
                            label: 'News posts per page',
                            type: 'number',
                            defaultValue: 10,
                            min: 1,
                            max: 100,
                            admin: {
                                description: 'How many posts the News pages show before linking to the next page.',
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
