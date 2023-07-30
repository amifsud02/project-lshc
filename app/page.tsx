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

const getFixtures = async (group: string) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/fixtures?allfixtures=${group}&season=2023&limit=5`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const fixtures = await response.json();
    return fixtures;
  } catch (error) {
    console.error("Error fetching fixtures:", error);
    // Fallback handling: Return a default value or an empty array.
    return [];
  }
};

const getStandings = async (group: string) => {
  console.log(group);
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
    // Fallback handling: Return a default value or an empty object.
    return [];
  }
};

export default async function Home() {
  const menFetchFixtures = await getFixtures('men');
  let menFixtures: IFixture[] = menFetchFixtures['fixtures'];

  const womenFetchFixtures = await getFixtures('women');
  let womenFixtures: IFixture[] = womenFetchFixtures['fixtures'];

  const womenFetchStandings = await getStandings("Women's Premier League");
  let womenStandings: IStanding[] = womenFetchStandings['standings'];

  const menFetchStandings = await getStandings("Men's National League");
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
                <Fixtures data={menFixtures} showTitle={false}></Fixtures>
              )}
            </Tab>

            <Tab tabTitle="Women">
              {womenFixtures && (
                <Fixtures data={womenFixtures} showTitle={false}></Fixtures>
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
              {menStandings && (
                <Standings key={'men_standings'} showTitle={false} data={menStandings}></Standings>
              )}
            </Tab>
            <Tab tabTitle="Women">
              {womenStandings && (
                <Standings key={'women_standings'} showTitle={false} data={womenStandings}></Standings>
              )}
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
