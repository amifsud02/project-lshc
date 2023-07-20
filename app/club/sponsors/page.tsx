import PageHeader from "@/components/PageHeader/PageHeader";
import SponsorCard from "@/components/Sponsor/sponsorCard";
import styles from '@/components/Sponsor/sponsors.module.css';

const Sponsors = () => {
    return (
        <>
            <PageHeader pageName='Our Partners' />
            <div className="parent">
                <div>
                    <h2 style={{fontSize: '1.5rem', fontWeight: '700'}}>Main Partners</h2>
                    <div className={styles.sponsorWrapper}>
                        <SponsorCard sponsorImage='sad' sponsorName='Sponsor Name' sponsorLink='https://cgowt.com'></SponsorCard>
                        <SponsorCard sponsorImage='sad' sponsorName='Sponsor Name' sponsorLink='https://cgowt.com'></SponsorCard>
                        <SponsorCard sponsorImage='sad' sponsorName='Sponsor Name' sponsorLink='https://cgowt.com'></SponsorCard>
                        <SponsorCard sponsorImage='sad' sponsorName='Sponsor Name' sponsorLink='https://cgowt.com'></SponsorCard>
                    </div>

                    <h2 style={{fontSize: '1.5rem', fontWeight: '700'}}>Main Partners</h2>
                    <div className={styles.sponsorWrapper}>
                        <SponsorCard sponsorImage='sad' sponsorName='Sponsor Name' sponsorLink='https://cgowt.com'></SponsorCard>
                        <SponsorCard sponsorImage='sad' sponsorName='Sponsor Name' sponsorLink='https://cgowt.com'></SponsorCard>
                        <SponsorCard sponsorImage='sad' sponsorName='Sponsor Name' sponsorLink='https://cgowt.com'></SponsorCard>
                        <SponsorCard sponsorImage='sad' sponsorName='Sponsor Name' sponsorLink='https://cgowt.com'></SponsorCard>
                    </div>

                    <h2 style={{fontSize: '1.5rem', fontWeight: '700'}}>Main Partners</h2>
                    <div className={styles.sponsorWrapper}>
                        <SponsorCard sponsorImage='sad' sponsorName='Sponsor Name' sponsorLink='https://cgowt.com'></SponsorCard>
                        <SponsorCard sponsorImage='sad' sponsorName='Sponsor Name' sponsorLink='https://cgowt.com'></SponsorCard>
                        <SponsorCard sponsorImage='sad' sponsorName='Sponsor Name' sponsorLink='https://cgowt.com'></SponsorCard>
                        <SponsorCard sponsorImage='sad' sponsorName='Sponsor Name' sponsorLink='https://cgowt.com'></SponsorCard>
                    </div>
                
                </div>
            </div>

        </>
    )
}

export default Sponsors;