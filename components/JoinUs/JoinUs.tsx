import styles from './JoinUs.module.css'

const JoinUs = () => {
    return (
        <section className={`${styles.joinUsContainer}`}>
            <div className={`${styles.joinUsWrapper}`} >
                <h2 className={`${styles.joinUsTitle}`}>Become Part of a Great Team</h2>
                <button className={`primary-button ${styles.joinUsButton}`}>Join Us</button>
            </div>
        </section>
    )
}

export default JoinUs;