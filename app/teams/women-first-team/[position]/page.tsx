'use client'

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation'
import { Partners }from '@/components/Partners/Partners';
import { IPlayerCard } from '@/lib/types/player.type';

import PageHeader from "@/components/PageHeader/PageHeader";
import PlayerCard from "@/components/PlayerCard/PlayerCard";
import Footer from '@/components/Footer/Footer';

const playerData: IPlayerCard[] = [
  {
    firstName: "Raffaella",
    lastName: "Zammit Tabona",
    position: "Goalkeeper",
    number: 1
  },
  {
    firstName: "Miriana",
    lastName: "Attard",
    position: "PlayMaker",
    number: 4
  },
  {
    firstName: "Stephanie",
    lastName: "Caruana",
    position: "PlayMaker",
    number: 5
  },
  {
    firstName: "Cassandra",
    lastName: "Petrella",
    position: "Lateral",
    number: 6
  },
  {
    firstName: "Jessica",
    lastName: "Agius",
    position: "Winger",
    number: 7
  },
  {
    firstName: "Ruth",
    lastName: "Debrincat",
    position: "LinePlayer",
    number: 8
  },
  {
    firstName: "Beti",
    lastName: "Petkovska",
    position: "LinePlayer",
    number: 9
  },
  {
    firstName: "Abigail",
    lastName: "Fenech Pomroy",
    position: "LinePlayer",
    number: 10
  },
  {
    firstName: "Nicole",
    lastName: "Gatt",
    position: "PlayMaker",
    number: 11
  },
  {
    firstName: "Paula",
    lastName: "Hundsrucker",
    position: "Goalkeeper",
    number: 16
  },
  {
    firstName: "Laura",
    lastName: "Berenguer Mellodo",
    position: "Lateral",
    number: 17
  },
  {
    firstName: "Shanice",
    lastName: "Ahar",
    position: "Winger",
    number: 18
  },
  {
    firstName: "Szabina",
    lastName: "Toth",
    position: "Lateral",
    number: 20
  },
  {
    firstName: "Kirsty",
    lastName: "Collins",
    position: "PlayMaker",
    number: 23
  },
  {
    firstName: "Kyra",
    lastName: "Licari",
    position: "LinePlayer",
    number: 24
  },
  {
    firstName: "Mirea",
    lastName: "Ferre",
    position: "Lateral",
    number: 26
  },
  {
    firstName: "Sarah",
    lastName: "Mifsud",
    position: "Lateral",
    number: 28
  },
  {
    firstName: "Stephanie",
    lastName: "Paris",
    position: "Lateral",
    number: 29
  },
  {
    firstName: "Kristina",
    lastName: "Falzon",
    position: "PlayMaker",
    number: 31
  },
  {
    firstName: "Desislava Yordanova",
    lastName: "Krasteva",
    position: "Winger",
    number: 77
  },
  {
    firstName: "Pero",
    lastName: "Arsoski",
    position: "Coach",        
  }
]


const positions = [
  { name: 'All', filter: (player: IPlayerCard) => true },
  { name: 'Goalkeepers', filter: (player: IPlayerCard) => player.position === 'Goalkeeper' },
  { name: 'Line-Players', filter: (player: IPlayerCard) => player.position === 'LinePlayer' },
  { name: 'Wingers', filter: (player: IPlayerCard) => player.position === 'Winger' },
  { name: 'Play-Makers', filter: (player: IPlayerCard) => player.position === 'PlayMaker' },
  { name: 'Lateral', filter: (player: IPlayerCard) => player.position === 'Lateral' },
  { name: 'Coach', filter: (player: IPlayerCard) => player.position === 'Coach' },
];

const WomenTeam = () => {
  const router = useRouter();
  const params = useParams(); // men-first-team/[position]

  const { position } = params;

  const updateURL = (position: string) => {
      const positionURL = `/teams/women-first-team/${position}`;
      router.push(positionURL);
  }

  const filteredPlayers = useMemo(() => {
      if (position) {
          const selectedPosition = (position as string).toLowerCase();

          const positionExists = positions.find(
              (pos) => pos.name.toLowerCase() === selectedPosition
          );

          if (positionExists) {
              // Filter the players based on the selected category
              return playerData.filter(positionExists.filter);
          }
      }

      // If position is undefined or not found in the positions array,
      // return the default list of players (all players).
      return playerData;
  }, [position]);

  const selectedPositionName = position && positions.find((pos) => pos.name.toLowerCase() === (position as string).toLowerCase())?.name;

  return (
      <>
          <PageHeader pageName='La Salle Universal Air' />
          <section className="parent">

              <div className="tabs__wrapper">
                  <ul className="nav__tab">
                      <div className="category">
                          {positions.map((p) => (
                              <button key={p.name} className={p.name.toLowerCase() === position ? `tablinks active` : 'tablinks'} onClick={() => updateURL(p.name.toLowerCase())}>{p.name.replace(/-/g, ' ')}</button>
                          ))}
                      </div>
                  </ul>
              </div>

              {
                  filteredPlayers.length === 0 ? (
                      <>
                          Coming Soon
                      </>) :
                      (
                          position && selectedPositionName?.toLowerCase() !== 'all' ? (
                              <>
                                  {
                                      filteredPlayers.length > 0 ? (
                                          <div>
                                              <h2 className='position-titles'>{selectedPositionName?.replace(/-/g, ' ')}</h2>
                                              <ul className='playercard-showcase'>
                                                  {filteredPlayers.map((player, index) => (
                                                       player.position == "Coach" ? 
                                                       <PlayerCard playerInfo={player} profilePicture={'https://res.cloudinary.com/dg6n3ybac/image/upload/f_auto,q_auto/cztzougqwpmysn1rlmnv'} key={index} /> 
                                                       :                                                       
                                                       <PlayerCard playerInfo={player} profilePicture={'https://res.cloudinary.com/dg6n3ybac/image/upload/f_auto,q_auto/tvmlhaydchymp7sqynf7'} key={index} />
                                                  ))}
                                              </ul>
                                          </div>
                                      ) : ''
                                  }
                              </>
                          ) : (
                              positions.filter(pos => pos.name !== 'All').map(pos => (
                                  <>
                                      {
                                          playerData.filter(pos.filter).length > 0 ?
                                              (
                                                  <div key={pos.name}>
                                                      <h2 className='position-titles'>{pos.name}</h2>
                                                      <ul className='playercard-showcase'>
                                                          {playerData.filter(pos.filter).map((player, index) => (
                                                               player.position == "Coach" ? 
                                                               <PlayerCard playerInfo={player} profilePicture={'https://res.cloudinary.com/dg6n3ybac/image/upload/f_auto,q_auto/cztzougqwpmysn1rlmnv'} key={index} /> 
                                                               :                                                       
                                                               <PlayerCard playerInfo={player} profilePicture={'https://res.cloudinary.com/dg6n3ybac/image/upload/f_auto,q_auto/tvmlhaydchymp7sqynf7'} key={index} />
                                                          ))}
                                                      </ul>
                                                  </div>
                                              ) : (
                                                  <></>
                                              )
                                      }
                                  </>
                              ))
                          )

                      )
              }
          </section>
          <Partners />
          <Footer />
      </>
  )
}

export default WomenTeam;
