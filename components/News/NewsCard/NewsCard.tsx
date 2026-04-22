import Link from "next/link";
import Image from "next/image";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import type { News, Media } from "@/payload-types";
import { NewsDate, NewsImageWrapper, NewsInfo, NewsTitle, NewsWrapper } from "@/components/StyledComponents";

dayjs.extend(utc);
dayjs.extend(timezone);

const DISPLAY_TZ = "Europe/Malta";

export interface INewsCard {
    data: News
}

function formatDateToCustomString(value: string | Date) {
    const d = dayjs(value).tz(DISPLAY_TZ);
    const day = d.date();
    const dayWithOrdinal = day + (
        (day % 10 === 1 && day !== 11) ? 'st' :
            (day % 10 === 2 && day !== 12) ? 'nd' :
                (day % 10 === 3 && day !== 13) ? 'rd' : 'th'
    );

    return `${dayWithOrdinal} ${d.format('MMM YYYY')}`;
}

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

const NewsCard: React.FC<INewsCard> = ({ data }) => {
    const formattedDate = formatDateToCustomString(data.publishedAt);
    const categorySlug = getCategorySlug(data.category);
    const href = categorySlug ? `/news/${categorySlug}/${data.slug}` : '#';
    const imageSrc = getMediaUrl(data.featuredImage);

    return (
        <NewsWrapper>
            <Link href={href}>
                <NewsImageWrapper className="newsCardImage">
                    {imageSrc ? (
                        <Image
                            src={imageSrc}
                            alt={data.title}
                            fill={true}
                            style={{
                                objectFit: 'cover',
                                objectPosition: 'center'
                            }}
                        />
                    ) : null}
                </NewsImageWrapper>
                <NewsInfo>
                    <NewsDate>{formattedDate}</NewsDate>
                    <NewsTitle>{data.title}</NewsTitle>
                </NewsInfo>
            </Link>
        </NewsWrapper>
    )
}

export default NewsCard;
