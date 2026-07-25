import Footer from "@/components/Footer/Footer";
import PageHeader from "@/components/PageHeader/PageHeader";
import { Partners } from "@/components/Partners/Partners";
import Link from "next/link";
import { notFound } from "next/navigation";
import GalleryCard from "@/components/Gallery/GalleryCard";
import {
    getGalleries,
    getGalleryCategories,
    getGalleryCategoryBySlug,
} from "@/lib/data/galleries";
import { OtherArticles } from "@/components/StyledComponents";
import type { Metadata } from "next";

const baseSiteUrl = process.env.NEXT_PUBLIC_API_URL;

type Params = { tag: string }

export async function generateMetadata(
    { params }: { params: Promise<Params> }
): Promise<Metadata> {
    const { tag } = await params;
    const cat = await getGalleryCategoryBySlug(tag);
    if (!cat) return {};
    return {
        title: `${cat.title} Galleries — La Salle Handball`,
        alternates: { canonical: `${baseSiteUrl}/news/photogallery/${cat.slug}` },
    };
}

export default async function GalleryTagPage({
    params,
}: {
    params: Promise<Params>
}) {
    const { tag } = await params;
    const [cat, categories] = await Promise.all([
        getGalleryCategoryBySlug(tag),
        getGalleryCategories(),
    ]);
    if (!cat) notFound();

    const galleries = await getGalleries({ tag: cat.slug });

    return (
        <>
            <PageHeader pageName={`${cat.title} Galleries`} />

            <section className="parent" style={{ paddingTop: 40, paddingBottom: 40 }}>
                <div style={{ marginBottom: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Link href="/news/photogallery" style={chipStyle(false)}>All</Link>
                    {categories.map((c) => (
                        <Link
                            key={c.id}
                            href={`/news/photogallery/${c.slug}`}
                            style={chipStyle(c.slug === cat.slug)}
                        >
                            {c.title}
                        </Link>
                    ))}
                </div>

                {galleries.length === 0 ? (
                    <p style={{ color: "#666" }}>No galleries in this tag yet.</p>
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
