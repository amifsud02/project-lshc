import GalleryView from "@/components/Gallery/GalleryView";
import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { getGalleryBySlug, getGalleryImages } from "@/lib/data/galleries";
import type { Gallery } from "@/payload-types";
import { siteOpenGraph } from "@/lib/utils/metadata";
import { seoDescription, seoImage, seoTitle, seoTitleText } from "@/lib/seo/meta";
import { paths } from "@/lib/seo/site";

export const revalidate = 60

// Nothing is pre-built; each page renders on its first visit and is then cached (see `revalidate`).
export function generateStaticParams() {
  return []
}

type Params = { tag: string; slug: string }

function getTagSlug(tag: Gallery['tag']): string | null {
    if (!tag) return null;
    if (typeof tag === 'string') return null;
    return tag.slug ?? null;
}

export async function generateMetadata(
    { params }: { params: Promise<Params> },
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { tag, slug } = await params;
    const data = await getGalleryBySlug(slug);
    if (!data || getTagSlug(data.tag) !== tag) return {};

    const previousImages = (await parent).openGraph?.images || [];
    const coverUrl = seoImage(data.meta, data.coverImage);
    const ogTitle = seoTitleText(data.meta, data.title);
    const description = seoDescription(data.meta, data.description);
    const path = paths.gallery(data)!;

    return {
        title: seoTitle(data.meta, data.title),
        description,
        alternates: { canonical: path },
        openGraph: await siteOpenGraph(parent, {
            title: ogTitle,
            description,
            url: path,
            images: coverUrl ? [coverUrl, ...previousImages] : previousImages,
        }),
    };
}

export default async function SingleGalleryPage({
    params,
}: {
    params: Promise<Params>
}) {
    const { tag, slug } = await params;
    const data = await getGalleryBySlug(slug);
    if (!data || getTagSlug(data.tag) !== tag) notFound();

    const images = await getGalleryImages(data.folder);

    return <GalleryView data={data} images={images} />
}
