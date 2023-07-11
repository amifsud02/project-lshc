import PageHeader from "@/components/PageHeader/PageHeader";
import SponsorCard from "@/components/Sponsor/sponsorCard";
import styles from '@/components/Sponsor/sponsors.module.css';

const Sponsors = () => {
    return (
        <>
            <PageHeader pageName='Our Partners'/>
            
            <div className={styles.sponsorWrapper}>
                <SponsorCard sponsorImage='sad' sponsorName='Sponsor Name' sponsorLink='https://cgowt.com'></SponsorCard>
                <SponsorCard sponsorImage='sad' sponsorName='Sponsor Name' sponsorLink='https://cgowt.com'></SponsorCard>
                <SponsorCard sponsorImage='sad' sponsorName='Sponsor Name' sponsorLink='https://cgowt.com'></SponsorCard>
                <SponsorCard sponsorImage='sad' sponsorName='Sponsor Name' sponsorLink='https://cgowt.com'></SponsorCard>
                <SponsorCard sponsorImage='sad' sponsorName='Sponsor Name' sponsorLink='https://cgowt.com'></SponsorCard>
                <SponsorCard sponsorImage='sad' sponsorName='Sponsor Name' sponsorLink='https://cgowt.com'></SponsorCard>
            </div>

        </>
    )
}

export default Sponsors;