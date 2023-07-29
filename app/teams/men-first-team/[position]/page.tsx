'use client'

import { useMemo } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation'
import { Partners } from '@/components/Partners/Partners';
import { IPlayerCard } from '@/lib/types/player.type';

import PageHeader from "@/components/PageHeader/PageHeader";
import PlayerCard from "@/components/PlayerCard/PlayerCard";
import Footer from '@/components/Footer/Footer';

const playerData: IPlayerCard[] = [
    {
        "firstName": "Jake",
        "lastName": "Camilleri",
        "position": "PlayMaker",
        "number": 1
      },
      {
        "firstName": "Francis",
        "lastName": "Buhagiar",
        "position": "LinePlayer",
        "number": 2
      },
      {
        "firstName": "Anthony",
        "lastName": "Mifsud",
        "position": "LinePlayer",
        "number": 5
      },
      {
        "firstName": "Josef",
        "lastName": "Camilleri",
        "position": "Goalkeeper",
        "number": 6
      },
      {
        "firstName": "Lizio",
        "lastName": "Buhagiar",
        "position": "Lateral",
        "number": 7
      },
      {
        "firstName": "Lowell",
        "lastName": "Bezzina",
        "position": "Lateral",
        "number": 9
      },
      {
        "firstName": "Neil",
        "lastName": "Gruppetta",
        "position": "PlayMaker",
        "number": 11
      },
      {
        "firstName": "Alan-Michael",
        "lastName": "Portelli",
        "position": "Winger",
        "number": 12
      },
      {
        "firstName": "Jeremy John",
        "lastName": "Scicluna",
        "position": "Winger",
        "number": 13
      },
      {
        "firstName": "Matthew",
        "lastName": "Fenech",
        "position": "Goalkeeper",
        "number": 16
      },
      {
        "firstName": "Miguel",
        "lastName": "Gruppetta",
        "position": "Winger",
        "number": 17
      },
      {
        "firstName": "Andrew",
        "lastName": "Tabone",
        "position": "LinePlayer",
        "number": 19
      },
      {
        "firstName": "Stefan",
        "lastName": "Meli",
        "position": "Winger",
        "number": 20
      },
      {
        "firstName": "Christopher",
        "lastName": "Magro",
        "position": "Lateral",
        "number": 22
      },
      {
        "firstName": "Alessandro",
        "lastName": "Zerafa",
        "position": "Winger",
        "number": 27
      },
      {
        "firstName": "Craig",
        "lastName": "Muscat",
        "position": "Goalkeeper",
        "number": 37
      },
      {
        "firstName": "Khalifa",
        "lastName": "Queslati",
        "position": "Lateral",
        "number": 66
      },
      {
        "firstName": "Julian",
        "lastName": "Seguna",
        "position": "LinePlayer",
        "number": 77
      },
      {
        "firstName": "Nico",
        "lastName": "Gambin",
        "position": "Goalkeeper",
        "number": 19
      },
      {
        "firstName": "Christian",
        "lastName": "Falzon",
        "position": "Goalkeeper",
        "number": 31
      },
      {
        "firstName": "Francesco",
        "lastName": "Musu",
        "position": "Goalkeeper",
        "number": 21
      },
      {
        "firstName": "John",
        "lastName": "Scicluna",
        "position": "Goalkeeper",
        "number": 28
      },
      {
        "firstName": "Matteo",
        "lastName": "Rubei",
        "position": "Winger",
        "number": 3
      },
      {
        "firstName": "Matthew",
        "lastName": "Buttigieg",
        "position": "Winger",
        "number": 32
      },
      {
        "firstName": "Pero",
        "lastName": "Arsoski",
        "position": "Lateral",
        "number": 99
      },
      {
        "firstName": "Robert",
        "lastName": "Cachia",
        "position": "Lateral",
        "number": 7
      },
      {
        "firstName": "Paul Jean Enrique",
        "lastName": "Faucheux",
        "position": "Lateral",
        "number": 4
      },
      {
        "firstName": "Micheal",
        "lastName": "Schembri",
        "position": "Lateral",
        "number": 29
      },
      {
        "firstName": "Ilija",
        "lastName": "Kalinov",
        "position": "LinePlayer",
        "number": 26
      },
      {
        "firstName": "Gabriel",
        "lastName": "Abela",
        "position": "LinePlayer",
        "number": 22
      },
      {
        "firstName": "Marcus",
        "lastName": "Cachia",
        "position": "LinePlayer",
        "number": 44
      },
      {
        "firstName": "Matthias",
        "lastName": "Nussbaum",
        "position": "LinePlayer",
        "number": 55
      },
      {
        "firstName": "Daryl",
        "lastName": "Magri",
        "position": "PlayMaker",
        "number": 30
      },
      {
        "firstName": "Jordi",
        "lastName": "Stafrace",
        "position": "Winger",
        "number": 8
      },
      {
        "firstName": "Mathis",
        "lastName": "Rigaber",
        "position": "Winger",
        "number": 36
      },
      {
        "firstName": "Ian",
        "lastName": "Turban",
        "position": "Lateral",
        "number": 17
      },
      {
        "firstName": "Mark",
        "lastName": "Gilson",
        "position": "LinePlayer",
        "number": 10
      },
      {
        "firstName": "Enea",
        "lastName": "Perisnaka",
        "position": "LinePlayer",
        "number": 36
      },
      {
        "firstName": "Nicholas",
        "lastName": "Fava",
        "position": "Lateral",
        "number": 11
      },
      {
        firstName: "Clive",
        lastName: "Ferrante",
        position: "Coach",        
      },
      {
        firstName: "Kenneth",
        lastName: "Hili",
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


const MenFirstTeam = () => {
    const router = useRouter();
    const params = useParams(); // men-first-team/[position]

    const { position } = params;

    const updateURL = (position: string) => {
        const positionURL = `/teams/men-first-team/${position}`;
        router.push(positionURL);
    }

    const filteredPlayers = useMemo(() => {
        if (position) {
            const selectedposition = position.toLowerCase();

            const positionExists = positions.find(
                (pos) => pos.name.toLowerCase() === selectedposition
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

    const selectedpositionfirstName = position && positions.find((pos) => pos.name.toLowerCase() === position.toLowerCase())?.name;

    return (
        <>
            <PageHeader pageName='La Salle Karrettun' />
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
                            position && selectedpositionfirstName?.toLowerCase() !== 'all' ? (
                                <>
                                    {
                                        filteredPlayers.length > 0 ? (
                                            <div>
                                                <h2 className='position-titles'>{selectedpositionfirstName?.replace(/-/g, ' ')}</h2>
                                                <ul className='playercard-showcase'>
                                                    {filteredPlayers.map((player, index) => (
                                                        <PlayerCard playerInfo={player} profilePicture={'https://res.cloudinary.com/dg6n3ybac/image/upload/f_auto,q_auto/cztzougqwpmysn1rlmnv'} key={index}/>
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

export default MenFirstTeam;


