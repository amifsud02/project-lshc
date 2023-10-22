import styles from './Partners.module.css'
import Image from 'next/image'

import { clientV2 } from '@/lib/utils/sanity/sanity.config';
async function getData() {
    const sponsors = await clientV2.fetch(`*[_type == "sponsorship"]`,
      { 
          cache: 'force-cache' 
      }
    )
  
    return {
      props: {
        sponsors,
      },
    }
  }
  
  export default async function Partners() {
    getData();

    return (
        <section className='parent'>
            <h2 className={styles.title}>Our Partners</h2>

            <div className={`${styles.partnerRow}`}>
                <a className={styles.partnerLink} href="https://www.facebook.com/karettun/" target="_blank" rel="noopener noreferrer">
                    <Image src={'https://res.cloudinary.com/dg6n3ybac/image/upload/f_auto,q_auto/kzzpipjhwyrniptlteb5'} alt={'Il-Karrettun Pub & Grill Logo'} height={90} width={90} className={styles.partnerLogo} priority={false}></Image>
                </a>
            </div>

            <hr className={styles.divider} />

            <div className={`${styles.partnerRow}`}>
                <a className={styles.partnerLink} href="https://www.1padelmalta.com/" target="_blank" rel="noopener noreferrer">
                    <Image src={'https://res.cloudinary.com/dg6n3ybac/image/upload/f_auto,q_auto/y6rmutspug6yoh466ztz'} alt={'1Padel Malta Logo'} height={90} width={90} className={styles.partnerLogo} priority={false}></Image>
                </a>
            </div>
        </section>
    )
}

export function PartnerCard() {

}
