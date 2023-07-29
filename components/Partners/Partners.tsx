import styles from './Partners.module.css'
import Image from 'next/image'

export function Partners() {
    return (
        <section className='parent'>
            <h2 className={styles.title}>Our Partners</h2>

            <div className={`${styles.partnerRow}`}>
                <a className={styles.partnerLink} href="https://www.facebook.com/karettun/" target="_blank" rel="noopener noreferrer">
                    <Image src={'https://res.cloudinary.com/dg6n3ybac/image/upload/f_auto,q_auto/kzzpipjhwyrniptlteb5'} alt={'Il-Karrettun Pub & Grill Logo'} height={90} width={90} className={styles.partnerLogo} priority={true}></Image>
                </a>
                <a className={styles.partnerLink} href="https://universalair.aero/" target="_blank" rel="noopener noreferrer">
                    <Image src={'https://res.cloudinary.com/dg6n3ybac/image/upload/f_auto,q_auto/lgccnyr3nrwut6x2a9nr'} alt={'Universal Air'} height={90} width={140} className={styles.partnerLogo} priority={true}></Image>
                </a>
                <a className={styles.partnerLink} href="https://www.facebook.com/MBImizzibrothersinstallations/" target="_blank" rel="noopener noreferrer">
                    <Image src={'https://res.cloudinary.com/dg6n3ybac/image/upload/f_auto,q_auto/yg1blvhybe0caon8v0i9'} alt={'MBI Logo'} height={90} width={90} className={styles.partnerLogo} style={{objectFit: 'contain'}} priority={true}></Image>
                </a>
                <a className={styles.partnerLink} href="http://metalcoltd.com" target="_blank" rel="noopener noreferrer">
                    <Image src={'https://res.cloudinary.com/dg6n3ybac/image/upload/f_auto,q_auto/euqm6jieje2kbxf9vljk'} alt={'Metalco Ltd. Logo'} height={90} width={90} className={styles.partnerLogo} priority={true}></Image>
                </a>
            </div>

            <hr className={styles.divider}/>

            <div className={`${styles.partnerRow}`}>
                <a className={styles.partnerLink} href="https://www.1padelmalta.com/" target="_blank" rel="noopener noreferrer">
                    <Image src={'https://res.cloudinary.com/dg6n3ybac/image/upload/f_auto,q_auto/y6rmutspug6yoh466ztz'} alt={'1Padel Malta Logo'} height={90} width={90} className={styles.partnerLogo} priority={true}></Image>
                </a>
                <a className={styles.partnerLink} href="https://webmonkeyz.com" target="_blank" rel="noopener noreferrer">
                    <Image src={'https://res.cloudinary.com/dg6n3ybac/image/upload/f_auto,q_auto/xtmfedyb6qj5hnyhhy3h'} alt={'Web Monkeyz Logo'} height={90} width={90} className={styles.partnerLogo} priority={true}></Image>
                </a>
                <a className={styles.partnerLink} href="" target="_blank" rel="noopener noreferrer">
                    <Image src={'https://res.cloudinary.com/dg6n3ybac/image/upload/f_auto,q_auto/clfsfvothsmrvk39zkmo'} alt={'JTI Logo'} height={90} width={90} className={styles.partnerLogo} priority={true}></Image>
                </a>
                <a className={styles.partnerLink} href="https://www.maypole.com.mt/" target="_blank" rel="noopener noreferrer">
                    <Image src={'https://res.cloudinary.com/dg6n3ybac/image/upload/f_auto,q_auto/hmqwgglas9jwaedppubz'} alt={'Maypole Logo'} height={90} width={90} className={styles.partnerLogo} priority={true}></Image>
                </a>
                <a className={styles.partnerLink} href="https://darmaningroup.com/teamsport/" target="_blank" rel="noopener noreferrer">
                    <Image src={'https://res.cloudinary.com/dg6n3ybac/image/upload/f_auto,q_auto/sv7ozfeqzon6yjo2jdpc'} alt={'Teamsport Logo'} height={90} width={90} className={styles.partnerLogo} priority={true}></Image>
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
