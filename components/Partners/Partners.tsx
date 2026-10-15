import styles from './Partners.module.css'
import Image from 'next/image'

export type Partner = {
    name: string;
    src: string;
    link?: string | null;
}

type PartnersProps = {
    heading?: string | null;
    partners: Partner[];
}

export function Partners({ heading, partners }: PartnersProps) {
    if (!partners.length) return null

    return (
        <section className='parent'>
            {heading ? <h2 className={styles.title}>{heading}</h2> : null}

            <div className={styles.partnerRow}>
                {partners.map((partner, i) => {
                    const logo = (
                        <Image src={partner.src} alt={`${partner.name} logo`} height={90} width={90} className={styles.partnerLogo} />
                    )
                    return partner.link ? (
                        <a key={i} className={styles.partnerLink} href={partner.link} target="_blank" rel="noopener noreferrer" title={partner.name}>
                            {logo}
                        </a>
                    ) : (
                        <span key={i} className={styles.partnerLink} title={partner.name}>{logo}</span>
                    )
                })}
            </div>
        </section>
    )
}
