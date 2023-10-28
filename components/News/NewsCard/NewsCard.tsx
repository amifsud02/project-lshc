import Link from "next/link";
import Image from "next/image";
import { INewsPost } from "@/lib/types/news";
import { urlFor } from "@/lib/utils/sanity/sanity.imageurl";
import { NewsDate, NewsImageWrapper, NewsInfo, NewsTitle, NewsWrapper } from "@/components/StyledComponents";

export interface INewsCard {
    data: INewsPost
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
    const date = new Date(data.date)
    const formattedDate = formatDateToCustomString(date);

    return (
        <NewsWrapper>
            <Link href={`${process.env.NEXT_PUBLIC_API_URL}/news/${data.slug.current}`}>
                <NewsImageWrapper className="newsCardImage">
                    <Image
                        src={`${urlFor(data.featuredImage.asset._ref)}`}                    
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