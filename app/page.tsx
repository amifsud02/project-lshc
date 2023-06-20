import TeamCarousel from '@/components/Carousel/Team'
import Fixtures from '@/components/Fixture/Fixture'
import { Header } from '@/components/Headers/Header'
import { Partners } from '@/components/Partners/Partners'
import Standings from '@/components/Standings/Standings'
import ListTeams from './client-side/listTeams'
import ListFixtures from './client-side/listFixtures'

import { getTeams } from '@/lib/utils/sanity/sanity.utils'

export default async function Home() {

  const teams = await getTeams();
  console.log(teams);

  return (
    <main>

      {teams.map((team) => (
        <h1 key={team._id}>{team.teamName}</h1>

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
  )
}