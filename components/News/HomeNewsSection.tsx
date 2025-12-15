import Link from "next/link";
import NewsCard from "@/components/News/NewsCard/NewsCard";
import { OtherArticles } from "@/components/StyledComponents";
import { getAllPosts } from "@/lib/data/newsPosts";

export default function HomeNewsSection() {
  const posts = getAllPosts().slice(0, 4);

  return (
    <section className="parent" style={{ paddingTop: 50, paddingBottom: 50 }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 20,
        }}
      >
        <h2 style={{ fontSize: 24, fontWeight: 800, textTransform: "uppercase" }}>
          Latest posts
        </h2>
        <Link
          href="/news/all-the-news"
          style={{ fontWeight: 700, textTransform: "uppercase", fontSize: 12 }}
        >
          View all
        </Link>
      </div>

      <OtherArticles>
        {posts.map((post) => (
          <NewsCard key={post._id} data={post} />
        ))}
      </OtherArticles>
    </section>
  );
}

