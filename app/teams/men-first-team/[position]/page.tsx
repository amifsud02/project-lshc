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
        number: 1,
        firstName: 'Alan',
        lastName: 'Portelli',
        profilePicture: '',
        position: 'Winger',
    },
    {
        number: 2,
        firstName: 'Daryl',
        lastName: 'Magri',
        profilePicture: '',
        position: 'LinePlayer'
    },
    {
        number: 3,
        firstName: 'Anthony',
        lastName: 'Mifsud',
        profilePicture: '',
        position: 'LinePlayer'
    },
    {
        number: 4,
        firstName: 'Alan',
        lastName: 'Portelli',
        profilePicture: '',
        position: 'Winger',
    },
    {
        number: 5,
        firstName: 'Daryl',
        lastName: 'Magri',
        profilePicture: '',
        position: 'LinePlayer'
    },
    {
        number: 6,
        firstName: 'Anthony',
        lastName: 'Mifsud',
        profilePicture: '',
        position: 'LinePlayer'
    },
    {
        number: 7,
        firstName: 'Anthony',
        lastName: 'Mifsud',
        profilePicture: '',
        position: 'Goalkeeper'
    },
    {
        number: 8,
        firstName: 'Anthony',
        lastName: 'Mifsud',
        profilePicture: '',
        position: 'Coach'
    },
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


// const MenFirstTeam = () => {
//     const router = useRouter();
//     const params = useParams();

//     const { position } = params;

//     const updateURL = (position: string) => {
//         const positionURL = `/teams/men-first-team/${position}`;
//         router.push(positionURL);
//     }

//     const filteredPlayers = useMemo(() => {
//         if (position) {
//             const selectedPosition = position.toLowerCase();

//             const positionExists = positions.find(
//                 (position) => position.name.toLowerCase() === selectedPosition
//             );

//             if (positionExists) {
//                 // Filter the players based on the selected category
//                 return playerData.filter(positionExists.filter);
//             }
//         }

//         return playerData;
//     }, [position]);

//     return (
//         <>
//             <PageHeader pageName='Men First Team' />
//             <section className="parent">

//                 <div className="tabs__wrapper">
//                     <ul className="nav__tab">
//                         <div className="category">
//                             {positions.map((position) => (
//                                 <button key={position.name} className={'tablinks'} onClick={() => updateURL(position.name.toLowerCase())}>{position.name.replace(/-/g, ' ')}</button>
//                             ))}
//                         </div>
//                     </ul>
//                 </div>


//                 <ul style={{ marginTop: '20px', display: 'flex', flexFlow: 'row wrap', justifyContent: 'flex-start' }}>
//                     {
//                         filteredPlayers && filteredPlayers.map((player, index) => (
//                             (player.position === 'Coach' ? <h2 key={index}>{player.firstName}</h2> :
//                                 <PlayerCard playerInfo={player} key={index} />
//                             )
//                         ))
//                     }
//                 </ul>


//             </section>
//         </>
//     )
// }

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
            <PageHeader pageName='Men First Team' />
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
                    filteredPlayers.length === 0 ? (
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

export default MenFirstTeam;


