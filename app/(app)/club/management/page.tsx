import type { Metadata, ResolvingMetadata } from "next";
import { siteOpenGraph } from "@/lib/utils/metadata";
import Footer from "@/components/Footer/Footer";
import PageHeader from "@/components/PageHeader/PageHeader";
import { Partners }from "@/components/Partners/Partners";
import { SITE_URL } from '@/lib/seo/site'

export const revalidate = 60

const title = 'Management'
const description = 'Meet the La Salle Handball leadership: President, Vice-President, and Sports Director of your team.'
const baseSiteUrl = SITE_URL;
const canonical = `${baseSiteUrl}/club/management`;

export async function generateMetadata(_: unknown, parent: ResolvingMetadata): Promise<Metadata> {
  return {
    title: title,
    description: description,
    // The committee section is still empty; keep it out of search results until it's filled in.
    robots: { index: false, follow: true },
    alternates: {
        canonical: canonical
    },
    openGraph: await siteOpenGraph(parent, {
        title: title,
        description: description,
        
        url: canonical,
    }),
  };
}

const Management = () => {
    return (
        <>
            <PageHeader pageName='Management' asHeading />
            <section className="parent"></section>

        </>
    )
}

export default Management;