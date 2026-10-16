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
import JsonLd from "@/components/Seo/JsonLd";
import { siteOpenGraph } from "@/lib/utils/metadata";
import { seoDescription, seoImage, seoTitle, seoTitleText } from "@/lib/seo/meta";
import { paths } from "@/lib/seo/site";
import { breadcrumbJsonLd, newsArticleJsonLd } from "@/lib/seo/structuredData";

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
    const imageUrl = seoImage(data.meta, data.featuredImage);
    const ogTitle = seoTitleText(data.meta, data.title);
    const description = seoDescription(data.meta, data.description);
    const path = paths.news(data)!;
    const section = typeof data.category === 'object' ? data.category?.title : undefined;

    return {
        title: seoTitle(data.meta, data.title),
        description,
        alternates: { canonical: path },
        openGraph: await siteOpenGraph(parent, {
            type: 'article',
            title: ogTitle,
            description,
            url: path,
            images: imageUrl ? [imageUrl, ...previousImages] : previousImages,
            publishedTime: data.publishedAt,
            modifiedTime: data.updatedAt,
            section: section ?? undefined,
            tags: data.tags ?? undefined,
        }),
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

    const categoryTitle = typeof data.category === 'object' ? data.category?.title ?? category : category;
    const path = paths.news(data)!;

    return (
        <>
            <JsonLd
                data={[
                    newsArticleJsonLd({
                        path,
                        headline: data.title,
                        description: seoDescription(data.meta, data.description),
                        image: seoImage(data.meta, data.featuredImage),
                        datePublished: data.publishedAt,
                        dateModified: data.updatedAt,
                        section: categoryTitle,
                        keywords: data.tags ?? undefined,
                    }),
                    breadcrumbJsonLd([
                        ['News', '/news'],
                        [categoryTitle, paths.newsCategory(category)],
                        [data.title, path],
                    ]),
                ]}
            />
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
