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
import Footer from "@/components/Footer/Footer";



const getFixtures = async () => {
  try {
    const response = await fetch(
      `http://localhost:3000/api/fixtures?competitiontypename=U21 Men's National League&season=2023&limit=5`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const fixtures = await response.json();
    return fixtures;

  } catch (error) {
    console.error('Error fetching fixtures:', error);
    // Fallback handling: Return a default value or an empty array.
    return [];
  }
};

const getStandings = async () => {
  try {
    const response = await fetch(
      `http://localhost:3000/api/standings?competitiontypename=U21%20Men%27s%20National%20League&season=2023`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const standings = await response.json();
    return standings;
  } catch (error) {
    console.error('Error fetching standings:', error);
    // Fallback handling: Return a default value or an empty object.
    return {};
  }
};

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
              {fixtures && 
                <Fixtures data={fixtures} showTitle={false}></Fixtures> 
              }
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
      <Footer />
    </main>
  );
}
