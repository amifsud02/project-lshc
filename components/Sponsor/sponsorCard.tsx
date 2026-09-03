import Link from 'next/link';
import Image from 'next/image';
import styles from './sponsors.module.css';

type sponsorCardProps = {
    sponsorImage: string;
    sponsorName: string;
    sponsorLink: string;
}

const SponsorCard = (props: sponsorCardProps) => {
    return (
        <div className={` card ${styles.sponsorCard}`}>
            <div className={styles.sponsorImage}>
                <Image src={props.sponsorImage} alt={props.sponsorName} height={90} width={90} className={styles.partnerLogo} />
            </div>
            <div className={styles.sponsorName}>{props.sponsorName}</div>
            <div className={styles.sponsorLink}>
                <Link href={props.sponsorLink}>
                    <button className='primary-button'>More</button>
                </Link>
            </div>
        </div>
    )
}

export default SponsorCard