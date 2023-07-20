import TeamCarousel from "@/components/Carousel/Team";
import { Header } from "@/components/Headers/Header";
import { Partners } from "@/components/Partners/Partners";
import Standings from "@/components/Standings/Standings";

import styles from '@/components/Fixture/Fixture.module.css'
import JoinUs from "@/components/JoinUs/JoinUs";
import Tabs from "@/components/Tab/Tabs";
import Tab from "@/components/Tab/Tab";

import { IFixture } from "@/lib/types/fixture.type";
import { IStanding } from "@/lib/types/standing.type";
import Fixtures from "@/components/Fixture/Fixture";
import Hero from "@/components/Hero/Hero";



const getFixtures = async () => {
  const response = await fetch(
    `http://localhost:3000/api/fixtures?competitiontypename=U21 Men's National League&season=2023&limit=5`
  );
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const fixtures = await response.json();
  return fixtures;
};

const getStandings = async () => {
  const response = await fetch(
    `http://localhost:3000/api/standings?competitiontypename=U21%20Men%27s%20National%20League&season=2023`
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const standings = await response.json();
  return standings
}

export default async function Home() {
  const { fixtures }: { fixtures: IFixture[] } = await getFixtures();
  const { standings }: { standings: IStanding[] } = await getStandings();

  return (
    <main>
      <Hero/>
      
      <section>
        <div className="parent">
          <h1 className="title">Latest Fixtures</h1>

          <Tabs redirect="/season/current" showall={true}>
            <Tab tabTitle="Men">
              <Fixtures data={fixtures} showTitle={false}></Fixtures>
              {/* <section className={styles.matchContainer}>
                <div className={styles.matchWrapper}>
                  {fixtures.map((fixture) => (
                    <>
                      <div className={styles.matchContent} key={fixture.awayTeamId.teamName}>
                        <div className={styles.match}>
                          <>
                            <div className={styles.homeTeam}>
                              <div className={styles.teamBadge}>

                              </div>
                              <span className={styles.teamName}>{fixture.homeTeamId.teamName}</span>
                            </div>

                            <div className={styles.matchDetails}>
                              <div className={styles.matchType}>
                                <h4>{fixture.status}</h4>
                              </div>
                              <div className={styles.matchScore}>
                                <span>
                                  {fixture.homeScore} - {fixture.awayScore}
                                </span>
                              </div>

                              <div className={styles.matchDate}>
                                04 June 2023<br />21:00
                              </div>
                            </div>

                            <div className={styles.awayTeam}>
                              <span className={styles.teamName}>{fixture.awayTeamId.teamName}</span>
                              <div className={styles.teamBadge}>

                              </div>
                            </div>
                          </>
                        </div>
                      </div>
                    </>
                  ))}
                </div>
              </section> */}
            </Tab>

            <Tab tabTitle="Women">
              
            </Tab>
          </Tabs>
        </div>
      </section>
      <section>
        <div className="parent">
          <h1 className="title">Standings</h1>

          <Tabs redirect="/season/current" showall={true}>
            <Tab tabTitle="Men">
              <Standings showTitle={false} data={standings}></Standings>
            </Tab>

            <Tab tabTitle="Women">
              {/* <Standings showTitle={false}></Standings> */}
            </Tab>
          </Tabs>
        </div>
      </section>
      <JoinUs></JoinUs>
      <TeamCarousel></TeamCarousel>
      <Partners />
    </main>
  );
}
