import { IStanding } from '@/lib/types/standing.type'
import { imageBuilder } from '@/lib/utils/sanity/sanity.config'

import Link from 'next/link'
import Image from 'next/image'

import styles from './Standings.module.css'


const Standings = ({ showTitle, data }: { showTitle: boolean, data: IStanding[] }) => {
    return (
        <div className={styles.tableContainer}>
            {showTitle &&
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 className={styles.sectionTitle}>Standings</h2>
                    <Link style={{ fontSize: '12px', fontWeight: '700' }} href={''}>See More</Link>
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
                            P
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
                        <div className={`${styles.tableCell}`}>
                            Pts
                        </div>
                    </div>


                    {data[0].teams.map((team, index) => {      
                        console.log(team.team.teamName)
                        return (
                            <div className={`${styles.tableRow} ${styles.tableBodyRow} ${team.team.teamName === 'La Salle' ? styles.tablePrimaryRow : ''}`} key={team.draws}>
                                <div className={`${styles.tableCell} ${styles.tableBodyCell}`}>
                                    {index + 1}
                                </div>
                                <div className={`${styles.tableCell} ${styles.tableBodyCell}`}>
                                    <div className={styles.team}>
                                        <Image src={imageBuilder.image(team.team.teamLogo.asset._ref).width(50).height(50).url()} alt={`${team.team.teamName}-logo`} width={40} height={40}></Image>
                                        <p className={styles.teamName}>{team.team.teamName}</p>
                                    </div>
                                </div>

                                <div className={`${styles.tableCell} ${styles.tableBodyCell}`}>
                                    23
                                </div>
                                <div className={`${styles.tableCell} ${styles.tableBodyCell}`}>
                                    {team.wins}
                                </div>
                                <div className={`${styles.tableCell} ${styles.tableBodyCell}`}>
                                    {team.draws}
                                </div>
                                <div className={`${styles.tableCell} ${styles.tableBodyCell}`}>
                                    {team.losses}
                                </div>
                                <div className={`${styles.tableCell} ${styles.tableBodyCell}`}>
                                    {team.goalDifference}
                                </div>
                                <div className={`${styles.tableCell} ${styles.tableBodyCell}`}>
                                    {/* {team.goalsAgainst} */}
                                </div>
                                <div className={`${styles.tableCell} ${styles.tableBodyCell}`}>
                                    {/* {team.goalsFor - team.goalsAgainst} */}
                                </div>
                                <div className={`${styles.tableCell} ${styles.tableBodyCell}`}>
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