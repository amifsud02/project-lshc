import TeamCarousel from "@/components/Carousel/Team";
import Fixtures from "@/components/Fixture/Fixture";
import { Header } from "@/components/Headers/Header";
import { Partners } from "@/components/Partners/Partners";
import Standings from "@/components/Standings/Standings";
import ListTeams from "./client-side/listTeams";
import ListFixtures from "./client-side/listFixtures";

const getFixtures = async () => {
  const response = await fetch(
    `http://localhost:3000/api/fixtures?competitiontypename=U21 Men's National League&season=2023`
  );
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const fixtures = await response.json();
  return fixtures;
};

type ILogo = {
  _type: string;
  asset: {
    _ref: string;
    _type: string
  }
}

type ITeam = {
  teamName: string;
  teamLogo: ILogo;
}

type IFixtures = {
  homeTeamId: ITeam;
  awayTeamId: ITeam;
  homeScore: number;
  awayScore: number;
  status: string;
  venue: string;
  startDate: Date;
};

export default async function Home() {
  const { fixtures }: { fixtures: IFixtures[] } = await getFixtures();
  console.log(fixtures[0].awayTeamId.teamLogo);


  return (
    <main>
      {fixtures.map((fixture) => (
        <>
          
          {fixture.homeScore}
          {fixture.homeTeamId.teamName}
          {fixture.awayScore}
          {fixture.awayTeamId.teamName}
          {fixture.venue}
          {fixture.status}
          <br/>
        </>
      ))}

      {/* <section className="bg">
        <Header />
      </section>



      <div style={{ maxWidth: '1280px', margin: 'auto' }}>
         <Fixtures showTitle={true} fixtures={fixtures}></Fixtures>
        <Standings showTitle={true}></Standings>
      </div>

      <TeamCarousel></TeamCarousel>
      <Partners /> */}
    </main>
  );
}
