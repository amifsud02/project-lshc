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
        <div className={styles.sponsorCard}>
            <div className={styles.sponsorImage}>
            <Image src={'/lshc.png'} alt={'LSHC Logo'} height={90} width={90} className={styles.partnerLogo}></Image>
                {/*{props.sponsorImage}*/}
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