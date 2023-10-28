import { IStanding } from '@/lib/types/standing.type'
import { imageBuilder } from '@/lib/utils/sanity/sanity.config'
import Image from 'next/image'
import crypto from 'crypto';

import styles from './Standings.module.css'


const Standings = ({ showTitle, data }: { showTitle: boolean, data: IStanding[] }) => {
    return (
        <div className={styles.tableContainer}>
            {showTitle &&
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 className={styles.sectionTitle}>Standings</h2>
                    {/* <Link style={{ fontSize: '12px', fontWeight: '700' }} href={''}>See More</Link> */}
                </div>
            }
            <div className={styles.tableWrapper}>
                <section className={styles.table}>
                    <div className={`${styles.tableRow} ${styles.tableHeaderRow}`}>
                        <div className={`${styles.tableCell}`}>
                            Pos
                        </div>
                        <div className={`${styles.tableCell}`}>
                            Team
                        </div>

                        <div className={`${styles.tableCell}`}>
                            GP
                        </div>
                        <div className={`${styles.tableCell}`}>
                            W
                        </div>
                        <div className={`${styles.tableCell}`}>
                            D
                        </div>
                        <div className={`${styles.tableCell}`}>
                            L
                        </div>
                        <div className={`${styles.tableCell}`}>
                            GF
                        </div>
                        <div className={`${styles.tableCell}`}>
                            GA
                        </div>
                        <div className={`${styles.tableCell}`}>
                            GD
                        </div>
                        <div className={`${styles.tableCell}`} style={{marginRight: '3px'}}>
                            Pts
                        </div>
                    </div>


                    {data[0].teams.map((team, index) => { 
                        return (
                            <div className={`${styles.tableRow} ${styles.tableBodyRow} ${team.team.name === 'La Salle' ? styles.tablePrimaryRow : ''}`} key={crypto.randomBytes(20).toString('hex')}>
                                <div className={`${styles.tableCell} ${styles.tableBodyCell}`}>
                                    {index + 1}
                                </div>
                                <div className={`${styles.tableCell} ${styles.tableBodyCell}`}>
                                    <div className={styles.team}>
                                        <Image src={imageBuilder.image(team.team.logo.asset._ref).width(50).height(50).url()} alt={`${team.team.name}-logo`} width={40} height={40}></Image>
                                        <p className={styles.name}>{team.team.name}</p>
                                    </div>
                                </div>

                                <div className={`${styles.tableCell} ${styles.tableBodyCell} numbers`}>
                                    {team.matchesPlayed}
                                </div>
                                <div className={`${styles.tableCell} ${styles.tableBodyCell} numbers`}>
                                    {team.wins}
                                </div>
                                <div className={`${styles.tableCell} ${styles.tableBodyCell} numbers`}>
                                    {team.draws}
                                </div>
                                <div className={`${styles.tableCell} ${styles.tableBodyCell} numbers`}>
                                    {team.losses}
                                </div>
                                <div className={`${styles.tableCell} ${styles.tableBodyCell} numbers`}>
                                    
                                </div>
                                <div className={`${styles.tableCell} ${styles.tableBodyCell} numbers`}>
                                    {/* {team.goalsAgainst} */}
                                </div>
                                <div className={`${styles.tableCell} ${styles.tableBodyCell} numbers`}>
                                    {team.goalDifference}
                                </div>
                                <div className={`${styles.tableCell} ${styles.tableBodyCell} numbers`} style={{marginRight: '3px'}}>
                                    {team.points}
                                </div>
                            </div>
                        )
                    })}

                </section>
            </div>
        </div>
    )
}

export default Standings;