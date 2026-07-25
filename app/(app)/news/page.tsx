import Footer from "@/components/Footer/Footer";
import PageHeader from "@/components/PageHeader/PageHeader";
import { Partners } from "@/components/Partners/Partners";
import Link from "next/link";
import NewsCard from "@/components/News/NewsCard/NewsCard";
import { getNewsPosts, getAllNewsTags, getNewsCategories } from "@/lib/data/news";
import { OtherArticles } from "@/components/StyledComponents";

const title = 'La Salle Handball News - Latest and real time updates'
const description = 'Stay up to date with news from the La Salle Handball world: all fixtures, training sessions, and much more. Live La Salle Handball together with its protagonists!'
const baseSiteUrl = process.env.NEXT_PUBLIC_API_URL;
const canonical = `${baseSiteUrl}/news`;

export const metadata = {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical },
};

type SP = { tag?: string | string[] }

export default async function NewsPage({
    searchParams,
}: {
    searchParams?: Promise<SP>
}) {
    const resolvedSearchParams = (await searchParams) ?? {};
    const selectedTag = typeof resolvedSearchParams.tag === "string" ? resolvedSearchParams.tag : undefined;

    const [posts, tags, categories] = await Promise.all([
        getNewsPosts({ tag: selectedTag }),
        getAllNewsTags(),
        getNewsCategories(),
    ]);

    return (
        <>
            <PageHeader pageName="News" />

            <section className="parent" style={{ paddingTop: 40, paddingBottom: 40 }}>
                <div style={{ marginBottom: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Link href="/news" style={chipStyle(true)}>All</Link>
                    {categories.map((c) => (
                        <Link key={c.id} href={`/news/${c.slug}`} style={chipStyle(false)}>
                            {c.title}
                        </Link>
                    ))}
                </div>

                {tags.length ? (
                    <div style={{ marginBottom: 20, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Link href="/news" style={tagChipStyle(!selectedTag)}>All tags</Link>
                        {tags.map((tag) => (
                            <Link
                                key={tag}
                                href={`/news?tag=${encodeURIComponent(tag)}`}
                                style={tagChipStyle(selectedTag === tag)}
                            >
                                {tag}
                            </Link>
                        ))}
                    </div>
                ) : null}

                <OtherArticles>
                    {posts.map((post) => (
                        <NewsCard key={post.id} data={post} />
                    ))}
                </OtherArticles>
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

function tagChipStyle(active: boolean): React.CSSProperties {
    return {
        padding: "6px 10px",
        borderRadius: 999,
        border: "1px solid rgba(0,0,0,0.1)",
        background: active ? "rgba(0,0,0,0.05)" : "transparent",
        fontWeight: 500,
        fontSize: 11,
    }
}
