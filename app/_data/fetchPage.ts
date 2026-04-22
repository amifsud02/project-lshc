import { draftMode } from "next/headers";
import { getPayload, Where } from "payload";
import config from "@payload-config";
import { Page } from "@/payload-types";

type PageParams = {
    slug: string[];
}

export const fetchPage = async ({ slug: slugSegments = ['home'] }: PageParams): Promise<null | Page> => {
    const { isEnabled: draft } = await draftMode();

    const payload = await getPayload({ config })
    const slug = slugSegments.at(-1);

    const slugConstraint: Where = slug ? {
        slug: {
            equals: slug
        },
    } : {
        or: [
            {
                slug: {
                    equals: ''
                },
            },
            {
                slug: {
                    equals: 'home' // Default slug for home page
                }
            },
            {
                slug: {
                    exists: false
                }
            }
        ]
    };

    const pageQuery = await payload.find({
        collection: 'pages',
        draft,
        limit: 1,
        where: slugConstraint,
            
    });

    if (!pageQuery.totalDocs) {
        return null;
    }

    return pageQuery.docs[0];
}