import Image from 'next/image';
import styles from './UpcomingFixture.module.css'
import { IFixture } from '@/lib/types/fixture.type';
import { imageBuilderV2 } from '@/lib/utils/sanity/sanity.config';
import CountdownTimer from '@/components/Countdown/CountdownTimer';
import Link from 'next/link';

const UpcomingFixture: React.FC<{ fixture: IFixture }> = ({ fixture }) => {
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

    return (
        <div className={styles.fixtureCard}>
            <div>
                <div>
                    <div className={`${styles.fixtureDate} numbers`}>
                        {formattedDate}
                    </div>
                    <div className={styles.fixtureType}>
                        <h4>{competitionName}</h4>
                    </div>
                </div>
            </div>

            <div className={styles.fixturesMain}>
                <div className={styles.homeTeam}>
                    <div className={styles.teamBadge}>
                        {
                            homeTeamLogo &&
                            <Image src={imageBuilderV2.image(homeTeamLogo.asset._ref).url()} alt={`${homeTeamName}`} width={256} height={256} loading={'eager'}></Image>
                        }
                    </div>
                    <span className={styles.teamName}>{homeTeamName}</span>
                </div>

                <div>
                    <div className={styles.countdown}>
                        <p style={{fontSize: '12px'}}>The match will start in:</p>
                        <CountdownTimer targetDate={dateObj} />
                    </div>

                    <div className={styles.fixtureTime}>
                        {formattedTime}
                    </div>
                </div>
                <div className={styles.awayTeam}>
                    <div className={styles.teamBadge}>
                        {
                            awayTeamLogo &&
                            <Image src={imageBuilderV2.image(awayTeamLogo.asset._ref).url()} alt={`${awayTeamName}`} width={256} height={256} loading={'eager'}></Image>
                        }
                    </div>
                    <span className={styles.teamName}>{awayTeamName}</span>
                </div>
            </div>

            <div>
                <span className={styles.fixtureLink}>
                    <Link href={`/fixtures/${fixture._id}`}>Match Report</Link>
                </span>
            </div>           
        </div>
    )
}

export default UpcomingFixture;

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const cleanCompetitionName = (compName: string) => {
    const pattern = /^(?:U21 Men's |U21 Women's |Men's |Women's )/;
    return compName.replace(pattern, '');
}
