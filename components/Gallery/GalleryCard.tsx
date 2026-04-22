import Link from "next/link";
import Image from "next/image";
import type { Gallery, Media } from "@/payload-types";
import { NewsDate, NewsImageWrapper, NewsInfo, NewsTitle, NewsWrapper } from "@/components/StyledComponents";

type Props = {
    data: Gallery
}

function formatDate(value: string | Date) {
    const d = new Date(value);
    const day = d.getDate();
    const month = d.toLocaleString('default', { month: 'short' });
    const year = d.getFullYear();
    const suffix =
        (day % 10 === 1 && day !== 11) ? 'st' :
        (day % 10 === 2 && day !== 12) ? 'nd' :
        (day % 10 === 3 && day !== 13) ? 'rd' : 'th';
    return `${day}${suffix} ${month} ${year}`;
}

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

const GalleryCard: React.FC<Props> = ({ data }) => {
    const tagSlug = getTagSlug(data.tag);
    const href = tagSlug ? `/news/gallery/${tagSlug}/${data.slug}` : '#';
    const imageSrc = getMediaUrl(data.coverImage);

    return (
        <NewsWrapper>
            <Link href={href}>
                <NewsImageWrapper className="newsCardImage">
                    {imageSrc ? (
                        <Image
                            src={imageSrc}
                            alt={data.title}
                            fill
                            style={{ objectFit: 'cover', objectPosition: 'center' }}
                        />
                    ) : null}
                </NewsImageWrapper>
                <NewsInfo>
                    <NewsDate>{formatDate(data.publishedAt)}</NewsDate>
                    <NewsTitle>{data.title}</NewsTitle>
                </NewsInfo>
            </Link>
        </NewsWrapper>
    )
}

export default GalleryCard;
