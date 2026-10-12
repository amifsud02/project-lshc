import Footer from "@/components/Footer/Footer";
import PageHeader from "@/components/PageHeader/PageHeader";
import { Partners } from "@/components/Partners/Partners";
import Link from "next/link";
import { notFound } from "next/navigation";
import NewsCard from "@/components/News/NewsCard/NewsCard";
import {
    getNewsPage,
    getNewsCategories,
    getNewsCategoryBySlug,
} from "@/lib/data/news";
import { OtherArticles } from "@/components/StyledComponents";
import Pagination from "@/components/News/Pagination/Pagination";
import type { Metadata } from "next";

const baseSiteUrl = process.env.NEXT_PUBLIC_API_URL;

type Params = { category: string }
type SP = { tag?: string | string[]; page?: string | string[] }

export async function generateMetadata(
    { params }: { params: Promise<Params> }
): Promise<Metadata> {
    const { category } = await params;
    const cat = await getNewsCategoryBySlug(category);
    if (!cat) return {};
    return {
        title: `${cat.title} — News`,
        alternates: { canonical: `${baseSiteUrl}/news/${cat.slug}` },
    };
}

export default async function NewsCategoryPage({
    params,
    searchParams,
}: {
    params: Promise<Params>
    searchParams?: Promise<SP>
}) {
    const { category } = await params;
    const [cat, categories] = await Promise.all([
        getNewsCategoryBySlug(category),
        getNewsCategories(),
    ]);
    if (!cat) notFound();

    const resolvedSearchParams = (await searchParams) ?? {};
    const selectedTag = typeof resolvedSearchParams.tag === "string" ? resolvedSearchParams.tag : undefined;

    const { posts, page, totalPages } = await getNewsPage({
        category: cat.slug,
        tag: selectedTag,
        page: Number(resolvedSearchParams.page) || 1,
    });

    return (
        <>
            <PageHeader pageName={cat.title} />

            <section className="parent" style={{ paddingTop: 40, paddingBottom: 40 }}>
                <div style={{ marginBottom: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Link href="/news" style={chipStyle(false)}>All</Link>
                    {categories.map((c) => (
                        <Link
                            key={c.id}
                            href={`/news/${c.slug}`}
                            style={chipStyle(c.slug === cat.slug)}
                        >
                            {c.title}
                        </Link>
                    ))}
                </div>

                {posts.length === 0 ? (
                    <p style={{ color: "#666" }}>No posts in this category yet.</p>
                ) : (
                    <OtherArticles>
                        {posts.map((post) => (
                            <NewsCard key={post.id} data={post} />
                        ))}
                    </OtherArticles>
                )}

                <Pagination basePath={`/news/${cat.slug}`} page={page} totalPages={totalPages} query={{ tag: selectedTag }} />
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
