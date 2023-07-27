import styles from './JoinUs.module.css'
import Link from 'next/link';

const JoinUs = () => {
    return (
        <section className={`${styles.joinUsContainer}`}>
            <div className={`parent ${styles.joinUsWrapper}`} >
                <h2 className={`${styles.joinUsTitle}`}>Become Part of a Great Team</h2>
                <Link href={'/contact'}><button className={`primary-button ${styles.joinUsButton}`}>Join Us</button></Link>
            </div>
        </section>
    )
}

export default JoinUs;