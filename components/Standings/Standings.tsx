import Link from 'next/link'
import styles from './Standings.module.css'
import Image from 'next/image'

const standings = {
    "season": {
        "id": "eb7b73cd-03cc-4a17-9c67-f50f4428bdd5",
        "year": 2022,
        "createdAt": "2023-05-27T07:36:19.717Z",
        "updatedAt": "2023-05-27T07:36:19.717Z",
        "competitions": [
            {
                "id": "bd26f789-e988-4994-befc-2f0597184e39",
                "name": "National League",
                "seasonId": "eb7b73cd-03cc-4a17-9c67-f50f4428bdd5",
                "categoryId": "849b9ab5-c88f-462a-98d6-1bd70e4e18c5",
                "createdAt": "2023-05-27T07:36:19.717Z",
                "updatedAt": "2023-05-27T07:36:19.717Z",
                "category": {
                    "id": "849b9ab5-c88f-462a-98d6-1bd70e4e18c5",
                    "name": "U21 Men",
                    "createdAt": "2023-05-27T07:24:34.576Z",
                    "updatedAt": "2023-05-27T07:24:34.576Z"
                },
                "leaderboard": {
                    "id": "9fa2d600-4c8d-4196-93f8-1d0f2d2a2305",
                    "competitionId": "bd26f789-e988-4994-befc-2f0597184e39",
                    "createdAt": "2023-05-27T07:36:19.717Z",
                    "updatedAt": "2023-05-27T07:36:19.717Z",
                    "teams": [
                        {
                            "id": "ec8327d1-83a8-411b-b29c-718cb7c64c13",
                            "leaderboardId": "9fa2d600-4c8d-4196-93f8-1d0f2d2a2305",
                            "teamId": "b73712e9-6661-4971-adc8-cd3afe636e52",
                            "wins": 0,
                            "losses": 0,
                            "draws": 0,
                            "goalsFor": 0,
                            "goalsAgainst": 0,
                            "createdAt": "2023-05-27T07:36:19.717Z",
                            "updatedAt": "2023-05-27T07:36:19.717Z",
                            "team": {
                                "id": "b73712e9-66861-4971-adc8-cd3afe636e52",
                                "name": "HMS",
                                "country": "Malta",
                                "logo": "https://thumbs2.imgbox.com/e0/5c/IZc6QwOm_t.png",
                                "createdAt": "2023-05-26T23:08:24.157Z",
                                "updatedAt": "2023-05-26T23:08:24.157Z"
                            }
                        },
                        {
                            "id": "a43afda4-c7d9-484e-8b68-f561c6910ae98",
                            "leaderboardId": "9fa2d600-4c8d-4196-93f8-1d0f2d2a2305",
                            "teamId": "7c6ace77-6621-4480-8607-d7a9248528ff",
                            "wins": 0,
                            "losses": 0,
                            "draws": 0,
                            "goalsFor": 0,
                            "goalsAgainst": 0,
                            "createdAt": "2023-05-27T07:36:19.717Z",
                            "updatedAt": "2023-05-27T07:36:19.717Z",
                            "team": {
                                "id": "7c6ace77-6621-4480-8607-d7a92648528ff",
                                "name": "La Salle",
                                "country": "Malta",
                                "logo": "https://i.postimg.cc/dQmDkZhK/LSHC.png",
                                "createdAt": "2023-05-26T22:57:38.449Z",
                                "updatedAt": "2023-05-26T22:57:38.449Z"
                            }
                        },
                        {
                            "id": "ec8327d1-85a8-411b-b29c-718cb7c648c13",
                            "leaderboardId": "9fa2d600-4c8d-4196-93f8-1d0f2d2a2305",
                            "teamId": "b73712e9-6661-4971-adc8-cd3afe636e52",
                            "wins": 0,
                            "losses": 0,
                            "draws": 0,
                            "goalsFor": 0,
                            "goalsAgainst": 0,
                            "createdAt": "2023-05-27T07:36:19.717Z",
                            "updatedAt": "2023-05-27T07:36:19.717Z",
                            "team": {
                                "id": "b73712e9-6661-4971-adc8-cd3afe636e52",
                                "name": "HMS",
                                "country": "Malta",
                                "logo": "https://thumbs2.imgbox.com/e0/5c/IZc6QwOm_t.png",
                                "createdAt": "2023-05-26T23:08:24.157Z",
                                "updatedAt": "2023-05-26T23:08:24.157Z"
                            }
                        },
                        {
                            "id": "a43afda4-c7d9-484e-8b68-f561c6910a6e9",
                            "leaderboardId": "9fa2d600-4c8d-4196-93f8-1d0f2d2a2305",
                            "teamId": "7c6ace77-6621-4480-8607-d7a9248528ff",
                            "wins": 0,
                            "losses": 0,
                            "draws": 0,
                            "goalsFor": 0,
                            "goalsAgainst": 0,
                            "createdAt": "2023-05-27T07:36:19.717Z",
                            "updatedAt": "2023-05-27T07:36:19.717Z",
                            "team": {
                                "id": "7c6ace77-6621-4480-8607-d7a924852898ff",
                                "name": "La Salle 1",
                                "country": "Malta",
                                "logo": "https://i.postimg.cc/dQmDkZhK/LSHC.png",
                                "createdAt": "2023-05-26T22:57:38.449Z",
                                "updatedAt": "2023-05-26T22:57:38.449Z"
                            }
                        },
                        {
                            "id": "ec8327d1-85a8-411b-b29c-718cb7c64356c13",
                            "leaderboardId": "9fa2d600-4c8d-4196-93f8-1d0f2d2a2305",
                            "teamId": "b73712e9-6661-4971-adc8-cd3afe6356836e52",
                            "wins": 0,
                            "losses": 0,
                            "draws": 0,
                            "goalsFor": 0,
                            "goalsAgainst": 0,
                            "createdAt": "2023-05-27T07:36:19.717Z",
                            "updatedAt": "2023-05-27T07:36:19.717Z",
                            "team": {
                                "id": "b73712e9-6661-4971-adc8-cd3af3568e636e52",
                                "name": "HMS",
                                "country": "Malta",
                                "logo": "https://thumbs2.imgbox.com/e0/5c/IZc6QwOm_t.png",
                                "createdAt": "2023-05-26T23:08:24.157Z",
                                "updatedAt": "2023-05-26T23:08:24.157Z"
                            }
                        },
                        {
                            "id": "a43afda4-c7d9-484e-8b68-f561c69135680ae9",
                            "leaderboardId": "9fa2d600-4c8d-4196-93f8-1d0f2d2a2305",
                            "teamId": "7c6ace77-6621-4480-8607-d7a94678248528ff",
                            "wins": 0,
                            "losses": 0,
                            "draws": 0,
                            "goalsFor": 0,
                            "goalsAgainst": 0,
                            "createdAt": "2023-05-27T07:36:19.717Z",
                            "updatedAt": "2023-05-27T07:36:19.717Z",
                            "team": {
                                "id": "7c6ace77-6621-4480-86045867-d7a9248528ff",
                                "name": "La Salle 1",
                                "country": "Malta",
                                "logo": "https://i.postimg.cc/dQmDkZhK/LSHC.png",
                                "createdAt": "2023-05-26T22:57:38.449Z",
                                "updatedAt": "2023-05-26T22:57:38.449Z"
                            }
                        },
                        {
                            "id": "ec8327d1-85a8-411b-b29c-725718cb7c64c13",
                            "leaderboardId": "9fa2d600-4c8d-4196-93f8-1d0f2d2a2305",
                            "teamId": "b73712e9-6661-4971-a2457dc8-cd3afe636e52",
                            "wins": 0,
                            "losses": 0,
                            "draws": 0,
                            "goalsFor": 0,
                            "goalsAgainst": 0,
                            "createdAt": "2023-05-27T07:36:19.717Z",
                            "updatedAt": "2023-05-27T07:36:19.717Z",
                            "team": {
                                "id": "b73712e9-6661-4971-adc8-cd3a2754fe636e52",
                                "name": "HMS",
                                "country": "Malta",
                                "logo": "https://thumbs2.imgbox.com/e0/5c/IZc6QwOm_t.png",
                                "createdAt": "2023-05-26T23:08:24.157Z",
                                "updatedAt": "2023-05-26T23:08:24.157Z"
                            }
                        },
                        {
                            "id": "a43afda4-c7d9-484e2457-8b68-f561c6910ae9",
                            "leaderboardId": "9fa2d600-4c8d-4196-93f8-1d0f2d2a2305",
                            "teamId": "7c6ace77-66245721-4480-8607-d7a9248528ff",
                            "wins": 0,
                            "losses": 0,
                            "draws": 0,
                            "goalsFor": 0,
                            "goalsAgainst": 0,
                            "createdAt": "2023-05-27T07:36:19.717Z",
                            "updatedAt": "2023-05-27T07:36:19.717Z",
                            "team": {
                                "id": "7c6ace77-6621-42457480-8607-d7a9248528ff",
                                "name": "La Salle 1",
                                "country": "Malta",
                                "logo": "https://i.postimg.cc/dQmDkZhK/LSHC.png",
                                "createdAt": "2023-05-26T22:57:38.449Z",
                                "updatedAt": "2023-05-26T22:57:38.449Z"
                            }
                        }
                    ]
                },
                "fixtures": [
                    {
                        "id": "93836b63-6338-4e3f-9ded-2372f927455c4f14",
                        "competitionId": "bd26f789-e988-4994-befc-2f0597184e39",
                        "homeTeamId": "7c6ace77-6621-4480-8607-d7a9248528ff",
                        "awayTeamId": "b73712e9-6661-4971-adc8-cd3afe636e52",
                        "homeTeamScore": 0,
                        "awayTeamScore": 0,
                        "date": "2023-05-27T07:36:18.546Z",
                        "location": "USH",
                        "time": "19:00",
                        "status": "Scheduled",
                        "createdAt": "2023-05-27T07:36:19.717Z",
                        "updatedAt": "2023-05-27T07:36:19.717Z",
                        "homeTeam": {
                            "id": "7c6ace77-6621-4480-8607-d7a9248528ff",
                            "name": "La Salle",
                            "country": "Malta",
                            "logo": "https://i.postimg.cc/dQmDkZhK/LSHC.png",
                            "createdAt": "2023-05-26T22:57:38.449Z",
                            "updatedAt": "2023-05-26T22:57:38.449Z"
                        },
                        "awayTeam": {
                            "id": "b73712e9-6661-4971-adc8-cd3afe636e52",
                            "name": "HMS",
                            "country": "Malta",
                            "logo": "https://thumbs2.imgbox.com/e0/5c/IZc6QwOm_t.png",
                            "createdAt": "2023-05-26T23:08:24.157Z",
                            "updatedAt": "2023-05-26T23:08:24.157Z"
                        }
                    }
                ]
            }
        ]
    }
}

const Standings = ({showTitle}: {showTitle: boolean}) => {
    return (
        <div className={styles.tableContainer}>
            {showTitle &&
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                    <h2 className={styles.sectionTitle}>Standings</h2>
                    <Link style={{fontSize: '12px', fontWeight: '700'}} href={''}>See More</Link>
                </div>
            }
            <div className={styles.tableWrapper}>
                <section className={styles.table}>
                    <div className={`${styles.tableRow} ${styles.tableHeaderRow}`}>
                        <div className={`${styles.tableCell}`}>
                            Pos
                        </div>
                        <div className={`${styles.tableCell}`}>

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

                    {standings.season.competitions.map((competition) => {
                        return competition.leaderboard.teams.map((team, index) => (
                            <div className={`${styles.tableRow} ${styles.tableBodyRow} ${team.team.name === 'La Salle' ? styles.tablePrimaryRow : ''}`} key={team.id}>
                                <div className={`${styles.tableCell} ${styles.tableBodyCell}`}>
                                    {index + 1}
                                </div>
                                <div className={`${styles.tableCell} ${styles.tableBodyCell}`}>
                                    <div className={styles.team}>
                                        <Image src={team.team.logo} alt={`${team.team.name} logo`} width={40} height={40}></Image>
                                        {team.team.name}
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
                                    {team.goalsFor}
                                </div>
                                <div className={`${styles.tableCell} ${styles.tableBodyCell}`}>
                                    {team.goalsAgainst}
                                </div>
                                <div className={`${styles.tableCell} ${styles.tableBodyCell}`}>
                                    {team.goalsFor - team.goalsAgainst}
                                </div>
                                <div className={`${styles.tableCell} ${styles.tableBodyCell}`}>
                                    123
                                </div>
                            </div>
                        ));
                    })}

                </section>
            </div>
        </div>
    )
}

export default Standings;