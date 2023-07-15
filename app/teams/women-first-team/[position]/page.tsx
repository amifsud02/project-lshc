'use client'

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation'

import PageHeader from "@/components/PageHeader/PageHeader";
import PlayerCard from "@/components/PlayerCard/PlayerCard";

export type IPlayerCard = {
    number: number;
    firstName: string;
    lastName: string;
    profilePicture?: string;
    position?: 'Goalkeeper' | 'LinePlayer' | 'Winger' | 'PlayMaker' | 'Lateral' | 'Coach';
}

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
    const params = useParams();

    const { position } = params;

    const updateURL = (position: string) => {
        const positionURL = `/teams/men-first-team/${position}`;
        router.push(positionURL);
    }

    const filteredPlayers = useMemo(() => {
        if (position) {
            const selectedPosition = position.toLowerCase();

            const positionExists = positions.find(
                (position) => position.name.toLowerCase() === selectedPosition
            );

            if (positionExists) {
                // Filter the players based on the selected category
                return playerData.filter(positionExists.filter);
            }
        }

        return playerData;
    }, [position]);

    return (
        <>
            <PageHeader pageName='Women First Team' />
            <section className="parent">

                <div className="tabs__wrapper">
                    <ul className="nav__tab">
                        <div className="category">
                            {positions.map((position) => (
                                <button key={position.name} className={'tablinks'} onClick={() => updateURL(position.name.toLowerCase())}>{position.name.replace(/-/g, ' ')}</button>
                            ))}
                        </div>
                    </ul>
                </div>

                {
                    playerData.length === 0 ? (
                        <>
                            Coming Soon
                        </> ) : 
                    (
                        position !== 'all' ? (
                            <>
                                {
                                    filteredPlayers.length > 0 ? (
                                        <div>
                                            <h2>{positions && positions.find((pos) => pos.name.toLowerCase() === position.toLowerCase()).name.replace(/-/g, ' ')}</h2>
                                            <ul style={{ marginTop: '20px', display: 'flex', flexFlow: 'row wrap', justifyContent: 'flex-start' }}>
                                                {filteredPlayers.map((player, index) => (
                                                    <PlayerCard playerInfo={player} key={index} />
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
                                                    <h2>{pos.name}</h2>
                                                    <ul style={{ marginTop: '20px', display: 'flex', flexFlow: 'row wrap', justifyContent: 'flex-start' }}>
                                                        {playerData.filter(pos.filter).map((player, index) => (
                                                            <PlayerCard playerInfo={player} key={index} />
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
        </>
    )
}

export default WomenTeam;


