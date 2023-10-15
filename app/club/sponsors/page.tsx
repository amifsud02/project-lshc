import PageHeader from "@/components/PageHeader/PageHeader";
import SponsorCard from "@/components/Sponsor/sponsorCard";
import styles from "@/components/Sponsor/sponsors.module.css";
import Footer from "@/components/Footer/Footer";

const title = 'Official La Salle Handball Sponsors'
const description = 'Explore the valued partners and official sponsors of La Salle Handball Club, standing by our players in every match.'
const baseSiteUrl = process.env.NEXT_PUBLIC_API_URL;
const canonical = `${baseSiteUrl}/club/management`;

export const metadata = {
    title: title,
    description: description,
    alternates: {
        canonical: canonical
    },
    openGraph: {
        title: title,
        description: description,
        // image: 'https://example.com/path/to/your-image.jpg',
        type: 'website', // or other applicable types
        url: canonical,
        // keywords: []
    }
};

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
              sponsorImage="https://res.cloudinary.com/dg6n3ybac/image/upload/f_auto,q_auto/kzzpipjhwyrniptlteb5"
              sponsorName="Il-Karrettun Pub & Grill"
              sponsorLink="https://www.facebook.com/karettun/"
            ></SponsorCard>
            <SponsorCard
              sponsorImage="https://res.cloudinary.com/dg6n3ybac/image/upload/f_auto,q_auto/lgccnyr3nrwut6x2a9nr"
              sponsorName="Universal Air"
              sponsorLink="https://universalair.aero/"
            ></SponsorCard>
            <SponsorCard
              sponsorImage="https://res.cloudinary.com/dg6n3ybac/image/upload/f_auto,q_auto/yg1blvhybe0caon8v0i9"
              sponsorName="MBI"
              sponsorLink="https://www.facebook.com/MBImizzibrothersinstallations/"
            ></SponsorCard>
            <SponsorCard
              sponsorImage="https://res.cloudinary.com/dg6n3ybac/image/upload/f_auto,q_auto/euqm6jieje2kbxf9vljk"
              sponsorName="Metalco Ltd."
              sponsorLink="http://metalcoltd.com/"
            ></SponsorCard>
          </div>

          <h2 style={{ fontSize: "1.5rem", fontWeight: "700" }}>Partners</h2>
          <div className={styles.sponsorWrapper}>
            <SponsorCard
              sponsorImage="https://res.cloudinary.com/dg6n3ybac/image/upload/f_auto,q_auto/y6rmutspug6yoh466ztz"
              sponsorName="1Padel"
              sponsorLink="https://www.1padelmalta.com/"
            ></SponsorCard>
            <SponsorCard
              sponsorImage="https://res.cloudinary.com/dg6n3ybac/image/upload/f_auto,q_auto/xtmfedyb6qj5hnyhhy3h"
              sponsorName="Web Monkeyz"
              sponsorLink="https://www.webmonkeyz.com/"
            ></SponsorCard>
            <SponsorCard
              sponsorImage="https://res.cloudinary.com/dg6n3ybac/image/upload/f_auto,q_auto/clfsfvothsmrvk39zkmo"
              sponsorName="JTI"
              sponsorLink="#"
            ></SponsorCard>
            <SponsorCard
              sponsorImage="https://res.cloudinary.com/dg6n3ybac/image/upload/f_auto,q_auto/hmqwgglas9jwaedppubz"
              sponsorName="Maypole"
              sponsorLink="https://www.maypole.com.mt/"
            ></SponsorCard>
            <SponsorCard
              sponsorImage="https://res.cloudinary.com/dg6n3ybac/image/upload/f_auto,q_auto/sv7ozfeqzon6yjo2jdpc"
              sponsorName="Teamsport"
              sponsorLink="https://darmaningroup.com/teamsport/"
            ></SponsorCard>
          </div>
        </div>
      </div>
      <Footer/>
    </>
  );
};

export default Sponsors;
