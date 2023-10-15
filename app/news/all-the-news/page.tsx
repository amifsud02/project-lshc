import Footer from "@/components/Footer/Footer";
import PageHeader from "@/components/PageHeader/PageHeader";
import { Partners } from "@/components/Partners/Partners";
import { clientV2 } from "@/lib/utils/sanity/sanity.config";

async function getData(slug: string) {
    const query = `*[_type == "news"] | order(publishedAt desc)`
    const data = await clientV2.fetch(query,
        {
            next: {
                revalidate: 604800
            }
        }
    );

    return data;
}

const title = 'La Salle Handball News - Latest and real time updates'
const description = 'Stay up to date with news from the La Salle Handball world: all fixtures, training sessions, and much more. Live La Salle Handball together with its protagonists!'
const baseSiteUrl = process.env.NEXT_PUBLIC_API_URL;
const canonical = `${baseSiteUrl}/news/all-the-news`;

export const metadata = {
    title: title,
    description: description,
    alternates: {
        canonical: canonical
    },
    openGraph: {
        title: title,
        description: description,
        
        url: canonical,
    }
};

export default async function NewsPage() {
    return (
        <>
            <PageHeader pageName="News" />

            <Partners />
            <Footer />
        </>
    )
}