import { getPayload } from "payload";
import config from "@payload-config";
import { Page } from "@/payload-types";

export const fetchPages = async (): Promise<Partial<Page>[]> => {
    const payload = await getPayload({ config })

    const data = await payload.find({
        collection: 'pages',
        depth: 2,
        limit: 300,
        where: {
            _status: {
                equals: 'published'
            }
        }
    })

    return data.docs;
}