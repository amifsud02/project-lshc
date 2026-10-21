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
                },
                {
                    label: 'Membership popup',
                    name: 'membershipPopup',
                    description: 'A popup that invites visitors to become members. It opens once per visitor and stays hidden for a while after they close it. It never opens on the shop, cart, checkout or account pages.',
                    fields: [
                        {
                            name: 'enabled',
                            label: 'Show the membership popup',
                            type: 'checkbox',
                            defaultValue: false,
                        },
                        {
                            name: 'badge',
                            label: 'Badge',
                            type: 'text',
                            defaultValue: 'Memberships now open',
                            admin: { description: 'Small label above the heading. Leave empty to hide it.' },
                        },
                        {
                            name: 'heading',
                            label: 'Heading',
                            type: 'text',
                            required: true,
                            defaultValue: 'Become a La Salle Handball member',
                        },
                        {
                            name: 'body',
                            label: 'Text',
                            type: 'textarea',
                            defaultValue: 'Back the club from the nursery to the senior squads — and get rewarded across Malta.',
                        },
                        {
                            name: 'benefits',
                            label: 'Benefits',
                            type: 'array',
                            maxRows: 4,
                            labels: { singular: 'Benefit', plural: 'Benefits' },
                            defaultValue: [
                                { text: 'Digital membership card in your Rypple wallet' },
                                { text: 'Discounts with 25+ partners — restaurants, gyms, retail' },
                                { text: 'Every euro supports our teams and youth programme' },
                            ],
                            fields: [{ name: 'text', type: 'text', required: true }],
                        },
                        {
                            name: 'image',
                            label: 'Image',
                            type: 'upload',
                            relationTo: 'media',
                            admin: { description: 'A team photo shown beside the text on larger screens. Leave empty to use the hero photo.' },
                        },
                        {
                            name: 'ctaLabel',
                            label: 'Button label',
                            type: 'text',
                            required: true,
                            defaultValue: 'View memberships',
                        },
                        {
                            name: 'ctaLink',
                            label: 'Button link',
                            type: 'text',
                            required: true,
                            defaultValue: '/membership',
                            admin: { description: 'Where the button goes: the Membership page, or /shop once the shop is public.' },
                        },
                        {
                            name: 'partnerNote',
                            label: 'Footnote',
                            type: 'text',
                            defaultValue: 'Secure checkout and member card by Rypple, the club’s membership partner.',
                        },
                        {
                            type: 'row',
                            fields: [
                                {
                                    name: 'delaySeconds',
                                    label: 'Open after (seconds)',
                                    type: 'number',
                                    defaultValue: 6,
                                    min: 0,
                                    max: 120,
                                },
                                {
                                    name: 'snoozeDays',
                                    label: 'Hide after closing (days)',
                                    type: 'number',
                                    defaultValue: 14,
                                    min: 1,
                                    max: 365,
                                    admin: { description: 'How long the popup stays hidden for a visitor who closes it.' },
                                },
                            ],
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
