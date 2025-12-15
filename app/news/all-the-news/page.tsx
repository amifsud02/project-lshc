import Footer from "@/components/Footer/Footer";
import PageHeader from "@/components/PageHeader/PageHeader";
import { Partners }from "@/components/Partners/Partners";
import Link from "next/link";
import NewsCard from "@/components/News/NewsCard/NewsCard";
import { getAllPosts, getAllTags } from "@/lib/data/newsPosts";
import { OtherArticles } from "@/components/StyledComponents";

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

export default function NewsPage({
    searchParams,
}: {
    searchParams?: { tag?: string | string[] }
}) {
    const selectedTag = typeof searchParams?.tag === "string" ? searchParams.tag : undefined;

    const tags = getAllTags();
    const posts = getAllPosts();
    const filteredPosts = selectedTag
        ? posts.filter((p) => p.tags.includes(selectedTag))
        : posts;

    return (
        <>
            <PageHeader pageName="News" />

            <section className="parent" style={{ paddingTop: 40, paddingBottom: 40 }}>
                <div style={{ marginBottom: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Link
                        href="/news/all-the-news"
                        style={{
                            padding: "8px 12px",
                            borderRadius: 999,
                            border: "1px solid rgba(0,0,0,0.15)",
                            background: !selectedTag ? "rgba(0,0,0,0.06)" : "transparent",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            fontSize: 12,
                        }}
                    >
                        All
                    </Link>
                    {tags.map((tag) => (
                        <Link
                            key={tag}
                            href={`/news/all-the-news?tag=${encodeURIComponent(tag)}`}
                            style={{
                                padding: "8px 12px",
                                borderRadius: 999,
                                border: "1px solid rgba(0,0,0,0.15)",
                                background: selectedTag === tag ? "rgba(0,0,0,0.06)" : "transparent",
                                fontWeight: 600,
                                textTransform: "uppercase",
                                fontSize: 12,
                            }}
                        >
                            {tag}
                        </Link>
                    ))}
                </div>

                <OtherArticles>
                    {filteredPosts.map((post) => (
                        // NewsCard will be updated to accept hard-coded posts.
                        <NewsCard key={post._id} data={post as any} />
                    ))}
                </OtherArticles>
            </section>

            <Partners />
            <Footer />
        </>
    )
}