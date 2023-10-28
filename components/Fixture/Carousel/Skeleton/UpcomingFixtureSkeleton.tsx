import React from 'react';
import styles from './UpcomingFixtureSkeleton.module.css'

const FixtureCardSkeleton = () => {
    return (
        <div className='mb-50'>
            <div className={styles.fixtureCard}>
                <div>
                    <div>
                        <div className={`${styles.fixtureDate} numbers`}></div>
                        <div className={styles.fixtureType}>
                            <h4></h4>
                        </div>
                    </div>
                </div>

                <div className={styles.fixturesMain}>
                    <div className={styles.homeTeam}>
                        <div className={styles.teamBadge}></div>
                        <div className={styles.teamName}></div>
                    </div>

                    <div>
                        <div className={styles.countdown}></div>
                        <div className={styles.fixtureTime}></div>
                    </div>
                    <div className={styles.awayTeam}>
                        <div className={styles.teamBadge}></div>
                        <div className={styles.teamName}></div>
                    </div>
                </div>

                <div>
                    <div className={styles.fixtureLink}></div>
                </div>
            </div>
        </div>
    );
};

export default FixtureCardSkeleton;
