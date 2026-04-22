import Footer from "@/components/Footer/Footer";
import PageHeader from "@/components/PageHeader/PageHeader";
import { Partners } from "@/components/Partners/Partners";
import Link from "next/link";
import GalleryCard from "@/components/Gallery/GalleryCard";
import { getGalleries, getGalleryCategories } from "@/lib/data/galleries";
import { OtherArticles } from "@/components/StyledComponents";

const title = 'Galleries — La Salle Handball';
const baseSiteUrl = process.env.NEXT_PUBLIC_API_URL;
const canonical = `${baseSiteUrl}/news/gallery`;

export const metadata = {
    title,
    alternates: { canonical },
    openGraph: { title, url: canonical },
};

export default async function GalleryIndexPage() {
    const [galleries, categories] = await Promise.all([
        getGalleries(),
        getGalleryCategories(),
    ]);

    return (
        <>
            <PageHeader pageName="Galleries" />

            <section className="parent" style={{ paddingTop: 40, paddingBottom: 40 }}>
                <div style={{ marginBottom: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Link href="/news/gallery" style={chipStyle(true)}>All</Link>
                    {categories.map((c) => (
                        <Link key={c.id} href={`/news/gallery/${c.slug}`} style={chipStyle(false)}>
                            {c.title}
                        </Link>
                    ))}
                </div>

                {galleries.length === 0 ? (
                    <p style={{ color: "#666" }}>No galleries yet.</p>
                ) : (
                    <OtherArticles>
                        {galleries.map((g) => (
                            <GalleryCard key={g.id} data={g} />
                        ))}
                    </OtherArticles>
                )}
            </section>


        </>
    )
}

function chipStyle(active: boolean): React.CSSProperties {
    return {
        padding: "8px 12px",
        borderRadius: 999,
        border: "1px solid rgba(0,0,0,0.15)",
        background: active ? "rgba(0,0,0,0.06)" : "transparent",
        fontWeight: 600,
        textTransform: "uppercase",
        fontSize: 12,
    }
}
