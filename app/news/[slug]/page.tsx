import Image from 'next/image'
import { INewsPost } from "@/lib/types/news";
import Footer from '@/components/Footer/Footer';
import { PortableText } from '@portabletext/react';
import { urlFor } from '@/lib/utils/sanity/sanity.imageurl';
import { clientV2 } from "@/lib/utils/sanity/sanity.config";
import PageHeader from '@/components/News/NewsHeader/PageHeader';

import type { Metadata, ResolvingMetadata } from 'next'
import styled from 'styled-components';
import { ArticleContent, OtherArticles } from '@/components/StyledComponents';
import SectionSeparator from '@/components/News/section-separator';
import NewsCard from '@/components/News/NewsCard/NewsCard';

type Props = {
    params: { slug: string }
    searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata(
    { params, searchParams }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const slug = params.slug

    // fetch data
    const data = (await getData(slug))[0] as INewsPost;
    const previousImages = (await parent).openGraph?.images || []

    return {
        title: data.title,
        openGraph: {
            title: data.title,
            description: data.description,
            images: [`${urlFor(data.featuredImage.asset._ref)}`, ...previousImages]
        }
    }
}

async function getData(slug: string) {
    const query = `*[_type == "news" && slug.current == "${slug}"]`
    const data = await clientV2.fetch(query,
        {
            cache: 'force-cache',
            next: {
                revalidate: 3600
            }
        });

    return data;
}


async function getPreviousAndNextPosts(slug: string) {
    // Query to fetch all news posts sorted by publication date
    const query = `*[_type == "news"] | order(publishedAt desc)`;

    // Fetch all blog posts
    const allPosts = await clientV2.fetch(query);

    // Find the index of the current post by slug
    const currentIndex = allPosts.findIndex((post: INewsPost) => post.slug.current === slug);

    // Calculate the indices for the previous and next posts
    const previousIndex = currentIndex - 1;
    const nextIndex = currentIndex + 1;

    // Get the previous and next posts, handling boundary cases
    const previousPost = previousIndex >= 0 ? allPosts[previousIndex] : null;
    const nextPost = nextIndex < allPosts.length ? allPosts[nextIndex] : null;

    return { previousPost, nextPost };
}

export default async function SingleNewsPage({ params }: { params: { slug: string } }) {
    const data = (await getData(params.slug))[0] as INewsPost;
    
    const { previousPost, nextPost } = await getPreviousAndNextPosts(params.slug);

    const baseSiteUrl = "https://development.lasallehandball.com/news/"

    const PortableTextComponent = {
        types: {
            image: ({ value }: { value: any }) => (
                <Image
                    className='news-image'
                    src={urlFor(value).url()}
                    alt="Image"
                    width={800}
                    height={800}
                />
            ),
        },
    };

    return (
        <>
            <PageHeader pageName={data.title} backgroundImage={urlFor(data.featuredImage.asset._ref)} ></PageHeader>

            <article className='parent'>
                <ArticleContent>
                    <PortableText
                        value={data.content}
                        components={PortableTextComponent}
                    />
                </ArticleContent>
            </article>

            {(previousPost || nextPost) &&
                <>
                    <SectionSeparator />

                    <section className='parent'>
                        <OtherArticles>
                            {previousPost && <NewsCard data={previousPost} />}
                            {nextPost && <NewsCard data={nextPost} />}
                        </OtherArticles>
                    </section>
                </>
            }

            <Footer />

        </>

    )
}

