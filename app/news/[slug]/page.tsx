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
            images: [`${urlFor(data.featuredImage.asset._ref)}`, ...previousImages ]
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

export default async function SingleNewsPage({ params }: { params: { slug: string } }) {
    const data = (await getData(params.slug))[0] as INewsPost;

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

            <SectionSeparator/>

            <section className='parent'>
               <OtherArticles>
                    <NewsCard data={data}/>
                    <NewsCard data={data}/>
                </OtherArticles>
            </section>
            <Footer />

        </>

    )
}

