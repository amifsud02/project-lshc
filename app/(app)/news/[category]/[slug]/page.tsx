import Footer from "@/components/Footer/Footer";
import PageHeader from "@/components/News/NewsHeader/PageHeader";
import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { ArticleContent, OtherArticles } from "@/components/StyledComponents";
import SectionSeparator from "@/components/News/section-separator";
import NewsCard from "@/components/News/NewsCard/NewsCard";
import { getNewsBySlug, getAdjacentNewsPosts } from "@/lib/data/news";
import type { Media, News } from "@/payload-types";

export const revalidate = 60

// Nothing is pre-built; each page renders on its first visit and is then cached (see `revalidate`).
export function generateStaticParams() {
  return []
}

type Params = { category: string; slug: string }

function getMediaUrl(m: string | Media | null | undefined): string {
    if (!m) return '';
    if (typeof m === 'string') return m;
    return m.url ?? '';
}

function getCategorySlug(category: News['category']): string | null {
    if (!category) return null;
    if (typeof category === 'string') return null;
    return category.slug ?? null;
}

export async function generateMetadata(
    { params }: { params: Promise<Params> },
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { category, slug } = await params;
    const data = await getNewsBySlug(slug);
    if (!data || getCategorySlug(data.category) !== category) return {};

    const previousImages = (await parent).openGraph?.images || [];
    const imageUrl = getMediaUrl(data.featuredImage);

    return {
        title: data.title,
        description: data.description,
        openGraph: {
            title: data.title,
            description: data.description,
            images: imageUrl ? [imageUrl, ...previousImages] : previousImages,
        },
    };
}

export default async function SingleNewsPage({
    params,
}: {
    params: Promise<Params>
}) {
    const { category, slug } = await params;
    const data = await getNewsBySlug(slug);
    if (!data || getCategorySlug(data.category) !== category) notFound();

    const { previous, next } = await getAdjacentNewsPosts(data);
    const featuredUrl = getMediaUrl(data.featuredImage);

    return (
        <>
            <PageHeader pageName={data.title} backgroundImage={featuredUrl} />

            <article className='parent'>
                <ArticleContent>
                    <RichText data={data.content} />
                </ArticleContent>
            </article>

            {(previous || next) ? (
                <>
                    <SectionSeparator />
                    <section className='parent'>
                        <OtherArticles>
                            {previous ? <NewsCard data={previous} /> : null}
                            {next ? <NewsCard data={next} /> : null}
                        </OtherArticles>
                    </section>
                </>
            ) : null}
        </>
    )
}
