import type { Metadata, ResolvingMetadata } from "next";
import { siteOpenGraph } from "@/lib/utils/metadata";
import PageHeader from "@/components/PageHeader/PageHeader";
import SponsorCard from "@/components/Sponsor/sponsorCard";
import styles from "@/components/Sponsor/sponsors.module.css";
import Footer from "@/components/Footer/Footer";

export const revalidate = 60

const title = 'Sponsors'
const description = 'Explore the valued partners and official sponsors of La Salle Handball Club, standing by our players in every match.'
const baseSiteUrl = process.env.NEXT_PUBLIC_API_URL;
const canonical = `${baseSiteUrl}/club/sponsors`;

export async function generateMetadata(_: unknown, parent: ResolvingMetadata): Promise<Metadata> {
  return {
    title: title,
    description: description,
    alternates: {
        canonical: canonical
    },
    openGraph: await siteOpenGraph(parent, {
        title: title,
        description: description,
        
        url: canonical,
    }),
  };
}

const Sponsors = () => {
  return (
    <>
      <PageHeader pageName="Our Partners" />
      <div className="parent">
        <div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "700" }}>
            Main Partners
          </h2>
          <div className={`sponsor-container ${styles.sponsorWrapper}`}>
            <SponsorCard
              sponsorImage="/sponsors/il-karrettun.png"
              sponsorName="Il-Karrettun Pub & Grill"
              sponsorLink="https://www.facebook.com/karettun/"
            ></SponsorCard>
            <SponsorCard
              sponsorImage="/sponsors/universal-air.png"
              sponsorName="Universal Air"
              sponsorLink="https://universalair.aero/"
            ></SponsorCard>
            <SponsorCard
              sponsorImage="/sponsors/mbi.png"
              sponsorName="MBI"
              sponsorLink="https://www.facebook.com/MBImizzibrothersinstallations/"
            ></SponsorCard>
            <SponsorCard
              sponsorImage="/sponsors/metalco.png"
              sponsorName="Metalco Ltd."
              sponsorLink="http://metalcoltd.com/"
            ></SponsorCard>
          </div>

          <h2 style={{ fontSize: "1.5rem", fontWeight: "700" }}>Partners</h2>
          <div className={styles.sponsorWrapper}>
            <SponsorCard
              sponsorImage="/sponsors/1padel.png"
              sponsorName="1Padel"
              sponsorLink="https://www.1padelmalta.com/"
            ></SponsorCard>
            <SponsorCard
              sponsorImage="/sponsors/web-monkeyz.png"
              sponsorName="Web Monkeyz"
              sponsorLink="https://www.webmonkeyz.com/"
            ></SponsorCard>
            <SponsorCard
              sponsorImage="/sponsors/jti.png"
              sponsorName="JTI"
              sponsorLink="#"
            ></SponsorCard>
            <SponsorCard
              sponsorImage="/sponsors/maypole.png"
              sponsorName="Maypole"
              sponsorLink="https://www.maypole.com.mt/"
            ></SponsorCard>
            <SponsorCard
              sponsorImage="/sponsors/teamsport.png"
              sponsorName="Teamsport"
              sponsorLink="https://darmaningroup.com/teamsport/"
            ></SponsorCard>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sponsors;
