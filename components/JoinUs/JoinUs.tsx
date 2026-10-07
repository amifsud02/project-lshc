import styles from './JoinUs.module.css'
import Link from 'next/link';

type JoinUsProps = {
    heading?: string | null;
    body?: string | null;
    ctaLabel?: string | null;
    ctaLink?: string | null;
}

const JoinUs = ({ heading, body, ctaLabel, ctaLink }: JoinUsProps) => {
    return (
        <section className={`${styles.joinUsContainer}`}>
            <div className={`parent ${styles.joinUsWrapper}`} >
                <div>
                    <h2 className={`${styles.joinUsTitle}`}>{heading || 'Become Part of a Great Team'}</h2>
                    {body ? <p className={styles.joinUsBody}>{body}</p> : null}
                </div>
                <Link href={ctaLink || '/contact'} className="btn btn--light">{ctaLabel || 'Join Us'}</Link>
            </div>
        </section>
    )
}

export default JoinUs;
