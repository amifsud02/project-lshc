import styles from './Partners.module.css'
import Image from 'next/image'

export function Partners() {
    return (
        <section className='parent'>
            <h2 className={styles.title}>Our Partners</h2>

            <div className={`${styles.partnerRow}`}>
                <a className={styles.partnerLink} href="http://metalcoltd.com" target="_blank" rel="noopener noreferrer">
                    <Image src={'https://res.cloudinary.com/dg6n3ybac/image/upload/f_auto,q_auto/euqm6jieje2kbxf9vljk'} alt={'Metalco Ltd. Logo'} height={90} width={90} className={styles.partnerLogo} priority={true}></Image>
                </a>
                <a className={styles.partnerLink} href="https://darmaningroup.com/teamsport/" target="_blank" rel="noopener noreferrer">
                    <Image src={'https://res.cloudinary.com/dg6n3ybac/image/upload/f_auto,q_auto/sv7ozfeqzon6yjo2jdpc'} alt={'Teamsport Logo'} height={90} width={90} className={styles.partnerLogo} priority={true}></Image>
                </a>
                <a className={`${styles.partnerLink} bg-black`} href="https://scramgym.com/" target="_blank" rel="noopener noreferrer">
                    <Image src={'/Scram-Gym-Logo-Web.webp'} alt={'Scram Logo'} height={45} width={90} className={styles.partnerLogo} priority={true}></Image>
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