import styles from './Partners.module.css'
import Image from 'next/image'

export function Partners() {
    return (
        <section className='parent'>
            <h2 className={styles.title}>Our Partners</h2>

            <div className={`${styles.partnerRow}`}>
                <a className={styles.partnerLink} href="" target="_blank" rel="noopener noreferrer">
                    <Image src={'/lshc.png'} alt={'LSHC Logo'} height={90} width={90} className={styles.partnerLogo}></Image>
                </a>
                <a className={styles.partnerLink} href="" target="_blank" rel="noopener noreferrer">
                    <Image src={'/lshc.png'} alt={'LSHC Logo'} height={90} width={90} className={styles.partnerLogo}></Image>
                </a>
                <a className={styles.partnerLink} href="" target="_blank" rel="noopener noreferrer">
                    <Image src={'/lshc.png'} alt={'LSHC Logo'} height={90} width={90} className={styles.partnerLogo}></Image>
                </a>
                <div className={styles.partnerLink} >
                    <Image src={'/lshc.png'} alt={'LSHC Logo'} height={90} width={90} className={styles.partnerLogo}></Image>
                </div>
            </div>

            <hr className={styles.divider}/>

            <div className={`${styles.partnerRow}`}>
                <a className={styles.partnerLink} href="" target="_blank" rel="noopener noreferrer">
                    <Image src={'/lshc.png'} alt={'LSHC Logo'} height={90} width={90} className={styles.partnerLogo}></Image>
                </a>
                <a className={styles.partnerLink} href="" target="_blank" rel="noopener noreferrer">
                    <Image src={'/lshc.png'} alt={'LSHC Logo'} height={90} width={90} className={styles.partnerLogo}></Image>
                </a>
                <a className={styles.partnerLink} href="" target="_blank" rel="noopener noreferrer">
                    <Image src={'/lshc.png'} alt={'LSHC Logo'} height={90} width={90} className={styles.partnerLogo}></Image>
                </a>
                <a className={styles.partnerLink} href="" target="_blank" rel="noopener noreferrer">
                    <Image src={'/lshc.png'} alt={'LSHC Logo'} height={90} width={90} className={styles.partnerLogo}></Image>
                </a>
                <a className={styles.partnerLink} href="" target="_blank" rel="noopener noreferrer">
                    <Image src={'/lshc.png'} alt={'LSHC Logo'} height={90} width={90} className={styles.partnerLogo}></Image>
                </a>
                <a className={styles.partnerLink} href="" target="_blank" rel="noopener noreferrer">
                    <Image src={'/lshc.png'} alt={'LSHC Logo'} height={90} width={90} className={styles.partnerLogo}></Image>
                </a>
                <a className={styles.partnerLink} href="" target="_blank" rel="noopener noreferrer">
                    <Image src={'/lshc.png'} alt={'LSHC Logo'} height={90} width={90} className={styles.partnerLogo}></Image>
                </a>
            </div>

            <div className={`${styles.partnerRow}`}>
                <a className={styles.partnerLink} href="">
                    <div className={styles.partnerLogo}></div>
                </a>
            </div>
        </section>
    )
}

export function PartnerCard() {

}
