import { draftMode } from "next/headers";
import { getPayload, Where } from "payload";
import config from "@payload-config";
import { Page } from "@/payload-types";
import { cachedFind } from "@/lib/utils/payload/cached";

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

    // A page that has never been published still exists as a draft document, so
    // the public site must ask for published pages explicitly.
    const query = {
        collection: 'pages' as const,
        limit: 1,
        where: draft ? slugConstraint : { and: [slugConstraint, { _status: { equals: 'published' } }] },
    };
    // Published pages come from the shared cache; drafts (admin preview) always go to the database.
    const pageQuery = draft
        ? await payload.find({ ...query, draft })
        : await cachedFind(query);

    if (!pageQuery.totalDocs) {
        return null;
    }

    return pageQuery.docs[0];
}