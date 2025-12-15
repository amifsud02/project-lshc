import Image from "next/image";
import Footer from "@/components/Footer/Footer";
import PageHeader from "@/components/News/NewsHeader/PageHeader";
import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { ArticleContent, OtherArticles } from "@/components/StyledComponents";
import SectionSeparator from "@/components/News/section-separator";
import NewsCard from "@/components/News/NewsCard/NewsCard";
import { getAllPosts, getPostBySlug } from "@/lib/data/newsPosts";
import type { HardcodedNewsContentBlock, IHardcodedNewsPost } from "@/lib/types/news";

type Props = {
    params: { slug: string }
    searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata(
    { params, searchParams }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const slug = params.slug

    const data = getPostBySlug(slug);
    if (!data) return {};

    const previousImages = (await parent).openGraph?.images || []

    return {
        title: data.title,
        description: data.description,
        openGraph: {
            title: data.title,
            description: data.description,
            images: [data.featuredImageUrl, ...previousImages]
        }
    }
}

function getPreviousAndNextPosts(slug: string): {
    previousPost: IHardcodedNewsPost | null
    nextPost: IHardcodedNewsPost | null
} {
    const allPosts = getAllPosts();
    const currentIndex = allPosts.findIndex((post) => post.slug.current === slug);

    const previousIndex = currentIndex - 1;
    const nextIndex = currentIndex + 1;

    const previousPost = previousIndex >= 0 ? allPosts[previousIndex] : null;
    const nextPost = nextIndex < allPosts.length ? allPosts[nextIndex] : null;

    return { previousPost, nextPost };
}

function ContentBlock({ block }: { block: HardcodedNewsContentBlock }) {
    if (block.type === "p") return <p>{block.text}</p>;
    if (block.type === "h3") return <h3>{block.text}</h3>;
    if (block.type === "image") {
        return (
            <Image
                className="news-image"
                src={block.src}
                alt={block.alt}
                width={block.width ?? 800}
                height={block.height ?? 800}
            />
        );
    }
    return null;
}

export default function SingleNewsPage({ params }: { params: { slug: string } }) {
    const data = getPostBySlug(params.slug);
    if (!data) notFound();

    const { previousPost, nextPost } = getPreviousAndNextPosts(params.slug);

    return (
        <>
            <PageHeader pageName={data.title} backgroundImage={data.featuredImageUrl} />

            <article className='parent'>
                <ArticleContent>
                    {data.content.map((block, idx) => (
                        <ContentBlock key={`${data._id}-${idx}`} block={block} />
                    ))}
                </ArticleContent>
            </article>

            {(previousPost || nextPost) &&
                <>
                    <SectionSeparator />

                    <section className='parent'>
                        <OtherArticles>
                            {/* NewsCard will be updated to accept hard-coded posts. */}
                            {previousPost && <NewsCard data={previousPost as any} />}
                            {nextPost && <NewsCard data={nextPost as any} />}
                        </OtherArticles>
                    </section>
                </>
            }

            <Footer />

        </>

    )
}

