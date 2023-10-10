import { imageBuilderV2 } from '@/lib/utils/sanity/sanity.config';
import { IFixture } from '@/lib/types/fixture.type';

import Image from 'next/image';

import styles from './Fixture.module.css'
import crypto from 'crypto';

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const cleanCompetitionName = (compName: string) => {
    const pattern = /^(?:U21 Men's |U21 Women's |Men's |Women's )/;
    return compName.replace(pattern, '');
}

const Fixtures = ({ showTitle, data }: { showTitle: boolean, data: IFixture[] }) => {

    return (
        <section className={styles.matchContainer}>
            <div className={styles.matchWrapper}>
                {data.map((fixture) => {
                    // const compName = cleanCompetitionName(fixture.competition.competitionType.competitionTypeName);
                    const dateObj = new Date(fixture.startDate);

                    let day = dateObj.getUTCDate();
                    let month = monthNames[dateObj.getUTCMonth()]; // getting the month name
                    let year = dateObj.getUTCFullYear();

                    let hours = ("0" + dateObj.getUTCHours()).slice(-2); // padding single digit hours with a leading zero
                    let minutes = ("0" + dateObj.getUTCMinutes()).slice(-2); // padding single digit minutes with a leading zero

                    let formattedDate = `${day} ${month} ${year}`;
                    let formattedTime = `${hours}:${minutes}`;

                    const homeTeamName = fixture.fixtureInfo.homeTeam.team.name
                    const homeTeamLogo = fixture.fixtureInfo.homeTeam.team.logo
                    const awayTeamName = fixture.fixtureInfo.awayTeam.team.name
                    const awayTeamLogo = fixture.fixtureInfo.awayTeam.team.logo
                    
                    const competitionName = fixture.fixtureInfo.competition[0].name;

                    console.log('Away Team Logo: ', awayTeamLogo)

                    return (
                        <>
                            <div className={styles.matchContent} key={crypto.randomBytes(20).toString('hex')}>
                                <div className={styles.match}>
                                    <>
                                        <div className={styles.homeTeam}>
                                            {
                                                homeTeamLogo &&
                                                <div className={styles.teamBadge}>
                                                    <Image src={imageBuilderV2.image(homeTeamLogo.asset._ref).url()} alt={`${homeTeamName}-logo`} width={256} height={256} loading={'eager'}></Image>
                                                </div>
                                            }
                                            <span className={styles.teamName}>{homeTeamName}</span>
                                        </div>

                                        <div className={styles.matchDetails}>
                                            <div>
                                                <div className={`${styles.matchDate} numbers`}>
                                                    {formattedDate} / {formattedTime}
                                                </div>
                                                <div className={styles.matchType}>
                                                    <h4>{competitionName}</h4>
                                                </div>
                                            </div>
                                            <div className={styles.matchScore}>
                                                <span className='numbers'>
                                                    {fixture.homeScore} - {fixture.awayScore}
                                                </span>
                                            </div>
                                            <div style={{fontSize: '0.75em'}}>
                                                <p>Fixture Report</p>
                                            </div>
                                           
                                        </div>

                                        <div className={styles.awayTeam}>
                                            <span className={styles.teamName}>{awayTeamName}</span>
                                            {
                                                awayTeamLogo &&
                                                <div className={styles.teamBadge}>
                                                    <Image src={imageBuilderV2.image(awayTeamLogo.asset._ref).url()} alt={`${awayTeamName}-logo`} width={256} height={256}></Image>
                                                </div>
                                            }
                                        </div>
                                    </>
                                </div>
                            </div>
                        </>
                    )
                })}
            </div>



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