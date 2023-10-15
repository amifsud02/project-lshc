import Footer from "@/components/Footer/Footer";
import PageHeader from "@/components/PageHeader/PageHeader";
import { Partners } from "@/components/Partners/Partners";

const title = 'La Salle Handball | Management'
const description = 'Meet the La Salle Handball leadership: President, Vice-President, and Sports Director of your team.'
const baseSiteUrl = process.env.NEXT_PUBLIC_API_URL;
const canonical = `${baseSiteUrl}/club/sponsors`;

export const metadata = {
    title: title,
    description: description,
    alternates: {
        canonical: canonical
    },
    openGraph: {
        title: title,
        description: description,
        // image: 'https://example.com/path/to/your-image.jpg',
        type: 'website', // or other applicable types
        url: canonical,
        // keywords: []
    }
};

const Management = () => {
    return (
        <>
            <PageHeader pageName='Management'/>
            <section className="parent"></section>
            <Partners/>
            <Footer/>
        </>
    )
}

export default Management;