import JoinUs from "@/components/JoinUs/JoinUs";
import Hero from "@/components/Hero/Hero";
import Footer from "@/components/Footer/Footer";
import { HeroV2 } from "@/components/HeroV2";
import HomeNewsSection from "@/components/News/HomeNewsSection";

export default async function Home() {
  return (
    <main>
      <Hero />
      <HomeNewsSection />
      <Footer />
    </main>
  );
}
