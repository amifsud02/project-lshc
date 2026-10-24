import type { Metadata, ResolvingMetadata } from "next";
import { siteOpenGraph } from "@/lib/utils/metadata";
import Footer from "@/components/Footer/Footer";
import PageHeader from "@/components/PageHeader/PageHeader";
import { Partners }from "@/components/Partners/Partners";

export const revalidate = 60

const title = 'Management'
const description = 'Meet the La Salle Handball leadership: President, Vice-President, and Sports Director of your team.'
const baseSiteUrl = process.env.NEXT_PUBLIC_API_URL;
const canonical = `${baseSiteUrl}/club/management`;

export async function generateMetadata(_: unknown, parent: ResolvingMetadata): Promise<Metadata> {
  return {
    title: title,
    description: description,
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
            <PageHeader pageName='Management'/>
            <section className="parent"></section>

        </>
    )
}

export default Management;