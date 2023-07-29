'use client'

import { useMemo } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation'

import PageHeader from "@/components/PageHeader/PageHeader";
import PlayerCard from "@/components/PlayerCard/PlayerCard";
import { Partners } from '@/components/Partners/Partners';
import Footer from '@/components/Footer/Footer';
import { IPlayerCard } from '@/lib/types/player.type';

const playerData: IPlayerCard[] = [
    {
        "firstName": "Anthony",
        "lastName": "Mifsud",
        "position": "Lateral",
        "number": 9
      },
      {
        "firstName": "Nico",
        "lastName": "Gambin",
        "position": "Winger",
        "number": 19
      },
      {
        "firstName": "Matthew",
        "lastName": "Fenech",
        "position": "Goalkeeper",
        "number": 16
      },
      {
        "firstName": "Neil",
        "lastName": "Gruppetta",
        "position": "PlayMaker",
        "number": 11
      },
      {
        "firstName": "Lizio",
        "lastName": "Buhagiar",
        "position": "Lateral",
        "number": 12
      },
      {
        "firstName": "Matthew",
        "lastName": "Buttigieg",
        "position": "Winger",
        "number": 7
      },
      {
        "firstName": "Enea",
        "lastName": "Perisnaka",
        "position": "Winger",
        "number": 24
      },
      {
        "firstName": "Ilija",
        "lastName": "Kalinov",
        "position": "LinePlayer",
        "number": 2
      },
      {
        "firstName": "Liam",
        "lastName": "Borg",
        "position": "LinePlayer",
        "number": 4
      },
      {
        "firstName": "Daniel",
        "lastName": "Mercieca",
        "position": "LinePlayer",
        "number": 28
      },
      {
        "firstName": "Gabriel",
        "lastName": "Abela",
        "position": "LinePlayer",
        "number": 22
      },
      {
        "firstName": "Mathis",
        "lastName": "Rigaber",
        "position": "Winger",
        "number": 17
      },
      {
        "firstName": "Liam",
        "lastName": "Apap",
        "position": "Winger",
        "number": 13
      },
      {
        "firstName": "Ben",
        "lastName": "Galea",
        "position": "Winger",
        "number": 6
      },
      {
        "firstName": "Harry",
        "lastName": "Camilleri Mallia",
        "position": "Goalkeeper",
        "number": 31
      },
      {
        "firstName": "Keiran",
        "lastName": "Demicoli",
        "position": "Winger",
        "number": 15
      },
      {
        firstName: "Clive",
        lastName: "Ferrante",
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


const U21MenTeam = () => {
    const router = useRouter();
    const params = useParams(); // men-first-team/[position]

    const { position } = params;

    const updateURL = (position: string) => {
        const positionURL = `/teams/u21-mens-team/${position}`;
        router.push(positionURL);
    }

    const filteredPlayers = useMemo(() => {
        if (position) {
            const selectedPosition = position.toLowerCase();

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

    const selectedPositionName = position && positions.find((pos) => pos.name.toLowerCase() === position.toLowerCase())?.name;

    return (
        <>
            <PageHeader pageName='La Salle MBI' />
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
                                                        <PlayerCard playerInfo={player} profilePicture={'https://res.cloudinary.com/dg6n3ybac/image/upload/f_auto,q_auto/cztzougqwpmysn1rlmnv'} key={index} />
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
                                                                <PlayerCard playerInfo={player} profilePicture={'https://res.cloudinary.com/dg6n3ybac/image/upload/f_auto,q_auto/cztzougqwpmysn1rlmnv'} key={index} />
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

export default U21MenTeam;


