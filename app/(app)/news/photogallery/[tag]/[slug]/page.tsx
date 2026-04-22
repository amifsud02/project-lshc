import Footer from "@/components/Footer/Footer";
import PageHeader from "@/components/News/NewsHeader/PageHeader";
import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getGalleryBySlug, getGalleryImages } from "@/lib/data/galleries";
import type { Gallery, Media } from "@/payload-types";

type Params = { tag: string; slug: string }

function getMediaUrl(m: string | Media | null | undefined): string {
    if (!m) return '';
    if (typeof m === 'string') return m;
    return m.url ?? '';
}

function getTagSlug(tag: Gallery['tag']): string | null {
    if (!tag) return null;
    if (typeof tag === 'string') return null;
    return tag.slug ?? null;
}

export async function generateMetadata(
    { params }: { params: Params | Promise<Params> },
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { tag, slug } = await params;
    const data = await getGalleryBySlug(slug);
    if (!data || getTagSlug(data.tag) !== tag) return {};

    const previousImages = (await parent).openGraph?.images || [];
    const coverUrl = getMediaUrl(data.coverImage);

    return {
        title: data.title,
        description: data.description ?? undefined,
        openGraph: {
            title: data.title,
            description: data.description ?? undefined,
            images: coverUrl ? [coverUrl, ...previousImages] : previousImages,
        },
    };
}

export default async function SingleGalleryPage({
    params,
}: {
    params: Params | Promise<Params>
}) {
    const { tag, slug } = await params;
    const data = await getGalleryBySlug(slug);
    if (!data || getTagSlug(data.tag) !== tag) notFound();

    const images = await getGalleryImages(data.folder);
    const heroUrl = getMediaUrl(data.coverImage) || getMediaUrl(images[0]);

    return (
        <>
            <PageHeader pageName={data.title} backgroundImage={heroUrl} />

            <section className="parent" style={{ paddingTop: 40, paddingBottom: 40 }}>
                {data.description ? (
                    <p style={{ marginBottom: 24, color: "#444", maxWidth: 720 }}>
                        {data.description}
                    </p>
                ) : null}

                {images.length === 0 ? (
                    <p style={{ color: "#666" }}>No images in this gallery yet.</p>
                ) : (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                            gap: 8,
                        }}
                    >
                        {images.map((img) => {
                            const src = getMediaUrl(img);
                            if (!src) return null;
                            return (
                                <div
                                    key={img.id}
                                    style={{
                                        position: "relative",
                                        width: "100%",
                                        aspectRatio: "1 / 1",
                                        overflow: "hidden",
                                        borderRadius: 4,
                                        background: "#eee",
                                    }}
                                >
                                    <Image
                                        src={src}
                                        alt={img.alt ?? ""}
                                        fill
                                        sizes="(max-width: 600px) 50vw, 25vw"
                                        style={{ objectFit: "cover" }}
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </>
    )
}
