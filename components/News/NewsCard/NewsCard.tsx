import Link from "next/link";
import Image from "next/image";
import type { IHardcodedNewsPost, INewsPost } from "@/lib/types/news";
import { urlFor } from "@/lib/utils/sanity/sanity.imageurl";
import { NewsDate, NewsImageWrapper, NewsInfo, NewsTitle, NewsWrapper } from "@/components/StyledComponents";

export interface INewsCard {
    data: INewsPost | IHardcodedNewsPost
}

function formatDateToCustomString(date: Date) {
    const formattedDate = new Date(date);

    // Extract the day, month, and year
    const day = formattedDate.getDate();
    const month = formattedDate.toLocaleString('default', { month: 'short' });
    const year = formattedDate.getFullYear();

    // Convert the day to the format "13th"
    const dayWithOrdinal = day + (
        (day % 10 === 1 && day !== 11) ? 'st' :
            (day % 10 === 2 && day !== 12) ? 'nd' :
                (day % 10 === 3 && day !== 13) ? 'rd' : 'th'
    );

    return `${dayWithOrdinal} ${month} ${year}`;
}

const NewsCard: React.FC<INewsCard> = ({ data }: INewsCard) => {
    const date = new Date((data as any).date)
    const formattedDate = formatDateToCustomString(date);

    const href = `/news/all-the-news/${data.slug.current}`;
    const imageSrc =
        "featuredImageUrl" in data
            ? data.featuredImageUrl
            : `${urlFor(data.featuredImage.asset._ref)}`;

    return (
        <NewsWrapper>
            <Link href={href}>
                <NewsImageWrapper className="newsCardImage">
                    <Image
                        src={imageSrc}
                        alt={data.title}
                        fill={true}
                        style={{
                            objectFit: 'cover',
                            objectPosition: 'center'
                        }}
                    />
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