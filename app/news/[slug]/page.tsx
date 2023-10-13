import Image from 'next/image'
import { INewsPost } from "@/lib/types/news";
import { urlFor } from '@/lib/utils/sanity/sanity.imageurl';
import { clientV2 } from "@/lib/utils/sanity/sanity.config";
import { PortableText } from '@portabletext/react';
import PageHeader from '@/components/News/NewsHeader/PageHeader';
import Footer from '@/components/Footer/Footer';

async function getData(slug: string) {
    const query = `*[_type == "news" && slug.current == "${slug}"]`
    const data = await clientV2.fetch(query);
    console.log(data);
    return data;
}

export default async function SingleNewsPage({ params }: { params: { slug: string } }) {
    const data = (await getData(params.slug))[0] as INewsPost;

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
                <div style={{padding: '0 150px'}}>
                    <PortableText
                        value={data.content}
                        components={PortableTextComponent}
                    />
                </div>
            </article>
            <Footer/>
            
        </>

    )
}