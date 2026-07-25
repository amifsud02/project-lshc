import { GlobalConfig } from "payload";
import { revalidateGlobal } from "./hooks/revalidateGlobal";

export const General: GlobalConfig = {
    slug: 'general',
    access: {
        read: ({ req: { user } }) => !!user,
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
                }
            ]
        }
    ],
    hooks: {
        afterChange: [revalidateGlobal('global:general')]
    }
}
