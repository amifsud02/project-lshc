'use client'

import TeamCarousel from "@/components/Carousel/Team";
import { Partners } from "@/components/Partners/Partners";
import Standings from "@/components/Standings/Standings";

import styles from "@/components/Fixture/Fixture.module.css";
import JoinUs from "@/components/JoinUs/JoinUs";
import Tabs from "@/components/Tab/Tabs";
import Tab from "@/components/Tab/Tab";

import { IFixture } from "@/lib/types/fixture.type";
import { IStanding } from "@/lib/types/standing.type";
import Fixtures from "@/components/Fixture/Fixture";
import Hero from "@/components/Hero/Hero";
import Footer from "@/components/Footer/Footer";
import { clientV2 } from "@/lib/utils/sanity/sanity.config";
import FixtureCarousel from "@/components/Fixture/Carousel";

const getHomePageFixtures = async (group: string, season: number) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v2/fixtures/season/${season}/${group}`,
      {
        cache: 'reload',
        next: {
          revalidate: 60 // once every 60 seconds
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const fixtures = await response.json();
    return fixtures;
  } catch (error) {
    console.error("Error fetching fixtures:", error);
    return false;
  }
};

const getStandings = async (group: string, season: number) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/standings?competitiontypename=${group}&season=2023`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const standings = await response.json();
    return standings;
  } catch (error) {
    console.error("Error fetching standings:", error);
    return [];
  }
};

export default async function Home() {
  let currentSeason = await clientV2.fetch(`*[_type == "settings"]`);
  currentSeason = Number(currentSeason[1].season);

  const today = new Date();

  /** Fetch Men Fixtures */
  const menFixtures = (await getHomePageFixtures('Men', currentSeason) as IFixture[])

  const menScheduledFixtures = menFixtures.filter(match => match.status === 'Scheduled' && new Date(match.startDate) > today).slice(0, 3);
  const menFinishedFixtures = menFixtures.filter(match => match.status === 'Completed' && new Date(match.startDate) < today).slice(0, 5);

  // const menFinishedFixtures: IFixture[] = menFixtures['finishedFixtures'];
  // const menScheduledFixtures: IFixture[] = menFixtures['scheduledFixtures'];

  /** Fetch Women Fixtures */
  const womenFixtures = (await getHomePageFixtures('Women', currentSeason) as IFixture[])
  const womenScheduledFixtures = menFixtures.filter(match => match.status === 'Scheduled' && new Date(match.startDate) > today).slice(0, 3);
  const womenFinishedFixtures = menFixtures.filter(match => match.status === 'Completed' && new Date(match.startDate) < today).slice(0, 5);

  // const womenFinishedFixtures: IFixture[] = womenFixtures['finishedFixtures'];
  // const womenScheduledFixtures: IFixture[] = womenFixtures['scheduledFixtures'];

  const womenFetchStandings = await getStandings("Women's Premier League", currentSeason);
  let womenStandings: IStanding[] = womenFetchStandings['standings'];

  const menFetchStandings = await getStandings("Men's National League", currentSeason);
  let menStandings: IStanding[] = menFetchStandings['standings'];

  return (
    <main>
      <Hero />

      <section>
        <div className="parent">
          <h1 className="title">Latest Fixtures</h1>

          <Tabs redirect="/season/2023/schedule/men/national-league/" showall={true}>
            <Tab tabTitle="Men">
              {menFixtures && (
                <>
                  <Fixtures data={menFinishedFixtures} showTitle={false} />
                  <FixtureCarousel data={menScheduledFixtures} />
                </>
              )}
            </Tab>

            <Tab tabTitle="Women">
              {womenFixtures && (
                <>
                  {womenFinishedFixtures.length > 0 && (
                    <Fixtures data={womenFinishedFixtures} showTitle={false} />
                  )}

                  {womenScheduledFixtures.length > 0 && (
                    <FixtureCarousel data={womenScheduledFixtures} />
                  )}


                </>
              )}
            </Tab>
          </Tabs>
        </div>
      </section>

      <section>
        <div className="parent">
          <h1 className="title">Standings</h1>

          <Tabs redirect="/season/2023/schedule/men/national-league/" showall={false}>
            <Tab tabTitle="Men">
              {/* {menStandings && (
                <Standings key={'men_standings'} showTitle={false} data={menStandings}></Standings>
              )} */}
            </Tab>
            <Tab tabTitle="Women">
              {/* {womenStandings && (
                <Standings key={'women_standings'} showTitle={false} data={womenStandings}></Standings>
              )} */}
            </Tab>
          </Tabs>
        </div>
      </section>

      <JoinUs></JoinUs>

      <TeamCarousel></TeamCarousel>
      <Partners />
      <Footer />
    </main>
  );
}
