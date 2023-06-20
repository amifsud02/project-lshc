import Link from 'next/link';
import styles from './Fixture.module.css'
import Image from 'next/image';
import { IFixtures } from '@/app/client-side/listFixtures';

const Fixtures = ({ showTitle, data }: { showTitle: boolean, data: IFixtures }) => {
    console.log(data.fixtures.data[0].attributes)
    return (
        <section className={styles.matchContainer}>
            {showTitle &&
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 className={styles.sectionTitle}>Fixtures</h2>
                    <Link style={{ fontSize: '12px', fontWeight: '700' }} href={''}>See More</Link>
                </div>
            }



            <div className={styles.matchWrapper}>
                {
                    data && data.fixtures.data.map((fixture) => {
                        return (
                            <div className={styles.matchContent} key={fixture.id}>
                                <div className={styles.match}>
                                    <>
                                        <div className={styles.homeTeam}>
                                            <div className={styles.teamBadge}>                                                
                                                <Image src={`http://localhost:1337${fixture.attributes.homeTeam.data.attributes.logo.data[0].attributes.url}`} alt={fixture.attributes.homeTeam.data.attributes.name} width={60} height={60}></Image> 
                                            </div>
                                            <span className={styles.teamName}>{fixture.attributes.homeTeam.data.attributes.name}</span>
                                        </div>

                                        <div className={styles.matchDetails}>
                                            <div className={styles.matchType}>
                                                <h4></h4>
                                            </div>



                                            <div className={styles.matchScore}>
                                                <span>
                                                    {fixture.homeTeamScore} - {fixture.awayTeamScore}
                                                </span>
                                            </div>

                                            <div className={styles.matchDate}>
                                                04 June 2023<br />21:00
                                            </div>
                                        </div>
                                    </>
                                </div>
                            </div>
                        )
                    })
                }
            </div>

            {
                data.fixtures.data.map((fixture) => (
                    <>
                        {fixture.id}
                        {fixture.attributes.homeTeam.data.attributes.name}
                    </>
                ))
            }

            {/* <div className={styles.matchWrapper}>
                {fixtures &&
                    fixtures.map((fixture) => {
                        return (
                            <div className={styles.matchContent} key={fixture.id}>
                                <div className={styles.match}>
                                    <>
                                        <div className={styles.homeTeam}>
                                            <div className={styles.teamBadge}>
                                                <Image src={fixture.homeTeam.logo} alt={fixture.homeTeam.name} width={60} height={60}></Image>
                                            </div>
                                            <span className={styles.teamName}>{fixture.homeTeam.name}</span>
                                        </div>

                                        <div className={styles.matchDetails}>
                                            <div className={styles.matchType}>
                                                <h4>National League</h4>
                                            </div>



                                            <div className={styles.matchScore}>
                                                <span>
                                                    {fixture.homeTeamScore} - {fixture.awayTeamScore}
                                                </span>
                                            </div>

                                            <div className={styles.matchDate}>
                                                04 June 2023<br />21:00
                                            </div>
                                        </div>

                                        <div className={styles.awayTeam}>
                                            <span className={styles.teamName}>{fixture.awayTeam.name}</span>
                                            <div className={styles.teamBadge}>
                                                <Image src={fixture.homeTeam.logo} alt={fixture.awayTeam.name} width={60} height={60} />
                                            </div>
                                        </div>
                                    </>
                                </div>
                            </div>
                        )
                    })
                }
            </div>

            <div className={styles.upcomingMatchWrapper}>
                <div className={styles.upcomingMatchContent}>
                    <div className={styles.upcomingMatch}>
                        <div className={styles.upcomingMatchHomeTeam}></div>
                        <div className={styles.upcomingMatchDetails}>
                            <div className={styles.matchType}>
                                <h4>National League</h4>
                            </div>

                            <div className={styles.upcomingMatchCountdown}>
                                Count Down
                            </div>

                            <div className={styles.matchDate}>
                                04 June 2023 / 21:00 <br /> USH / MSIDA
                            </div>
                        </div>
                        <div className={styles.upcomingMatchHomeTeam}></div>
                    </div>
                </div>
            </div> */}
        </section>
    );
}

export default Fixtures


// const Fixtures = ({ showTitle, fixtures}: { showTitle: boolean, fixtures: any }) => {
//     return (
//         <section className={styles.matchContainer}>
//             {showTitle &&
//                 <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
//                     <h2 className={styles.sectionTitle}>Fixtures</h2>
//                     <Link style={{fontSize: '12px', fontWeight: '700'}} href={''}>See More</Link>
//                 </div>
//             }
//             <div className={styles.matchWrapper}>
//                 {fixtures &&
//                     fixtures.map((fixture) => {
//                         return (
//                             <div className={styles.matchContent} key={fixture.id}>
//                                 <div className={styles.match} >
//                                     <>
//                                         <div className={styles.homeTeam}>
//                                             <div className={styles.teamBadge}>
//                                                 {/* <Image src={fixture.homeTeam.logo} alt={fixture.homeTeam.name} width={60} height={60}></Image> */}
//                                             </div>
//                                             <span className={styles.teamName}>{fixture.homeTeam.name}</span>
//                                         </div>

//                                         <div className={styles.matchDetails}>
//                                             <div className={styles.matchType}>
//                                                 <h4>National League</h4>
//                                             </div>



//                                             <div className={styles.matchScore}>
//                                                 <span>
//                                                     {fixture.homeTeamScore} - {fixture.awayTeamScore}
//                                                 </span>
//                                             </div>

//                                             <div className={styles.matchDate}>
//                                                 04 June 2023<br />21:00
//                                             </div>
//                                         </div>

//                                         <div className={styles.awayTeam}>
//                                             <span className={styles.teamName}>{fixture.awayTeam.name}</span>
//                                             <div className={styles.teamBadge}>
//                                                 {/* <Image src={fixture.homeTeam.logo} alt={fixture.awayTeam.name} width={60} height={60} /> */}
//                                             </div>
//                                         </div>
//                                     </>
//                                 </div>
//                             </div>
//                         )
//                     })
//                 }
//             </div>

//             <div className={styles.upcomingMatchWrapper}>
//                 <div className={styles.upcomingMatchContent}>
//                     <div className={styles.upcomingMatch}>
//                         <div className={styles.upcomingMatchHomeTeam}></div>
//                         <div className={styles.upcomingMatchDetails}>
//                             <div className={styles.matchType}>
//                                 <h4>National League</h4>
//                             </div>

//                             <div className={styles.upcomingMatchCountdown}>
//                                 Count Down
//                             </div>

//                             <div className={styles.matchDate}>
//                                 04 June 2023 / 21:00 <br /> USH / MSIDA
//                             </div>
//                         </div>
//                         <div className={styles.upcomingMatchHomeTeam}></div>
//                     </div>
//                 </div>
//             </div>
//         </section>
//     );
// }

// export default Fixtures