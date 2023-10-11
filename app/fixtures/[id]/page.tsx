"use client";

import { NextPage } from "next";
import { MapPin } from "lucide-react";
import styled from "styled-components";
import Navbar from "@/components/Hero/Navbar";
import Footer from "@/components/Footer/Footer";
import React, { useEffect, useState } from "react";
import { Partners } from "@/components/Partners/Partners";
import { useParams, useSearchParams } from "next/navigation";
import CountdownTimer from "@/components/Countdown/CountdownTimer";
import { IFixtureData, IPlayer } from "@/lib/types/fixture-info.type";
import { clientV2, imageBuilderV2 } from "@/lib/utils/sanity/sanity.config";

const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    // Get the day name, date, and month name
    const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
    const day = date.getDate();
    const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(date);
    const year = date.getFullYear();

    // Get the hours and minutes, ensuring they are two digits
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    // Construct the formatted date string
    const formattedDate = `${dayName} ${day} ${monthName} ${year}`;
    const formattedTime = `${hours}:${minutes}`;

    return {
        formattedDate,
        formattedTime
    }
}

const FixturePageHeader: React.FC<{ fixtureData: IFixtureData }> = ({ fixtureData }) => {

    const { homeTeam, awayTeam } = fixtureData?.fixtureInfo;
    const dateTime = formatDate(fixtureData.startDate.toString());

    return (
        <header>
            <FixtureHeader>
                <Navbar />
                <div className='parent fixtures-page'>
                    <HeaderContent>
                        <Top>
                            <div className="numbers">{dateTime.formattedDate}</div>
                            <div style={{display: 'inline-flex'}}><MapPin height={'16px'} /> {fixtureData.venue}</div>
                        </Top>
                        <Middle>
                            <Team isSecond={false}>
                                <TeamName>{homeTeam.team.name}</TeamName>
                                <TeamLogo src={imageBuilderV2.image(homeTeam.team.logo).url()} />
                            </Team>

                            <TimeScore className="numbers">{dateTime.formattedTime}</TimeScore>

                            <Team isSecond={true}>
                                <TeamName>{awayTeam.team.name}</TeamName>
                                <TeamLogo src={imageBuilderV2.image(awayTeam.team.logo).url()} />
                            </Team>
                        </Middle>
                        <Bottom className="numbers">
                            <CountdownTimer targetDate={fixtureData.startDate} />
                        </Bottom>
                    </HeaderContent>
                </div>
            </FixtureHeader>
        </header>
    )
}

const PlayerInfo: React.FC<{ player: IPlayer, isRight: boolean }> = ({ player, isRight }) => {
    return (
        <PlayerContent isRight={isRight}>
            <PlayerImage></PlayerImage>
            <PlayerName isRight={isRight}>{player.firstName} {player.lastName}</PlayerName>
            <PlayerStats className="numbers" isRight={isRight}>{player.goalsScored}</PlayerStats>
        </PlayerContent>
    )
}

const FixturePageContent: React.FC<{ fixtureData: IFixtureData }> = ({ fixtureData }) => {
    const { homeTeam, awayTeam } = fixtureData?.fixtureInfo;

    const homeTeamPlayers = homeTeam?.players || [];
    const awayTeamPlayers = awayTeam?.players || [];

    return (
        <>
            <section>
                <FixturePageHeader fixtureData={fixtureData} />
            </section>

            <article className="parent">
                {(homeTeamPlayers.length <= 5 || awayTeamPlayers.length <= 5) ? (
                    <p style={{ textAlign: 'center' }}>Line Up Not Available</p>
                ) : (
                    <LineUpWrapper>
                        <LineUpTitle>Lineup</LineUpTitle>
                        <Divider />
                        <LineUpContainer>
                            <LineUpColumn>
                                <Team isSecond={false} style={{ marginBottom: '20px' }}>
                                    <TeamName>{homeTeam.team.name}</TeamName>
                                    {homeTeam.team.hasOwnProperty("logo") ?
                                        <TeamLogo src={imageBuilderV2.image(homeTeam.team.logo).url()} /> : ''
                                    }
                                </Team>
                                <LineUpHeader>
                                    <span style={{ flexGrow: '1' }}></span>
                                    <span style={{ flexGrow: '5' }}></span>
                                    <div style={{ flexGrow: '1', textAlign: 'right' }}>Goals</div>
                                </LineUpHeader>
                                {homeTeam && homeTeam.players.map((player: IPlayer) => (
                                    <PlayerInfo key={player._id} player={player} isRight={false} />
                                ))}
                            </LineUpColumn>

                            <LineUpColumn>
                                <Team isSecond={true} style={{ marginBottom: '20px' }}>
                                    <TeamName>{awayTeam.team.name}</TeamName>
                                    {awayTeam.team.hasOwnProperty("logo") ?
                                        <TeamLogo src={imageBuilderV2.image(awayTeam.team.logo).url()} /> : ''
                                    }
                                </Team>
                                <LineUpHeader>
                                    <div style={{ flexGrow: '1', textAlign: 'left' }}>Goals</div>
                                    <span style={{ flexGrow: '5' }}></span>
                                    <span style={{ flexGrow: '1' }}></span>
                                </LineUpHeader>
                                {awayTeam.players && awayTeam.players.map((player: IPlayer) => (
                                    <PlayerInfo key={player._id} player={player} isRight={true} />
                                ))}
                            </LineUpColumn>
                        </LineUpContainer>
                    </LineUpWrapper>
                )}
            </article>

            <Partners />
            <Footer />
        </>
    )
}

const FixturePage: NextPage = () => {
    const { id } = useParams();
    const [fixtureData, setFixtureData] = useState(null);


    useEffect(() => {
        const fetchFixtureData = async () => {
            try {
                const data = await clientV2.fetch(`*[_type == "fixture" && _id == "${id}"]`);
                setFixtureData(data[0]);  // assuming data is an array and you're interested in the first item
            } catch (error) {
                console.error('Error fetching fixture data:', error);
            }
        };

        fetchFixtureData();
    }, [id]);

    if (!fixtureData) {
        return <div>Loading...</div>;  // render loading state while fetching
    }

    return (
        <FixturePageContent fixtureData={fixtureData} />
    );
}

export default FixturePage;

const Divider = styled.hr`
    width: 100%;
    height: 2px;
    background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(0, 13, 36, 0.5) 50%, rgba(255,255,255,0) 100%);
    margin-bottom: 60px;
`;

const FixtureHeader = styled.header`
    width: 100%;
    height: 600px;
    z-index: -1;
    display: flex;
    flex-flow: column;
    justify-content: space-evenly;
    background: linear-gradient(125deg, rgba(1, 41, 111, 1) 0%, rgba(0, 13, 36, 0.95) 100%), url('/template.svg') no-repeat center;
    background-size: cover;
    color: white;

    @media (min-width: 768px) {
        justify-content: flex-end;
    }
`;

const HeaderContent = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 300px;

    @media (min-width: 768px) {
        gap: 0px;
    }
`

const Top = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    font-size: 0.75em;
    font-weight: 600;
    opacity: 0.8;
    flex-basis: 0;
    flex-grow: 1;
    gap: 10px;
`;

const Middle = styled.div`    
    flex-grow: 6;
    flex-basis: 0;
    display: grid;
    grid-template-columns: 1fr 100px 1fr;
    place-items: center;
    -webkit-box-align: center;
`;

const Bottom = styled.div`
    // margin-top: 20px;
    display: flex;
    justify-content: center;
    text-align: center;
    flex-grow: 1;
    flex-basis: 0;
    font-size: 0.75em;
    font-weight: 600;
    opacity: 1;
`;

const Countdown = styled.div`
    display: none;
`

const Team = styled.div<{ isSecond: boolean }>`
    display: flex;
    flex-direction: column-reverse;
    align-items: center;
    gap: 15px;
    height: 50px;
    max-height: 50px;
    justify-content: center;

    text-align: ${props => (props.isSecond ? 'left' : 'right')};

    @media (min-width: 700px) {
        gap: 30px;
        flex-direction: ${props => (props.isSecond ? 'row-reverse' : 'row')};
    }
`;

const TeamLogo = styled.img`

    width: 60px;
    height: 60px;

    @media (min-width: 768px) {
        width: 75px;
        height: 75px;
    }
    
`;

const TeamName = styled.h4`
    font-size: 0.75rem;
    line-height: 1rem;
    font-weight: 700;
    text-transform: uppercase;

    @media (min-width: 768px) {
        font-size: 2rem;
        line-height: 2rem;
    }
`;

const TimeScore = styled.div`
    margin: 0 20px;
    text-align: center;
    
    margin: 15px 0;
    font-weight: 700;
    font-size: 18px;
    font-family: "Montserrat", sans-serif !important; 
    padding: 10px 15px; 
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.2)
`;

const LineUpWrapper = styled.article`
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    
`

const LineUpContainer = styled.section`
    display: flex;
    gap: 50px;
`

const LineUpHeader = styled.div`
    display: flex;
    width: 100%;
    gap: 20px;
    margin: 10px 0;

`

const LineUpTitle = styled.h6`
    text-align: center;
    font-size: 1.5rem;
    text-transform: uppercase;
    margin-bottom: 50px;
`

const LineUpColumn = styled.div`
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    width: 50%;
`
const PlayerContent = styled.div<{ isRight: boolean }>`
    display: flex;
    flex-direction: ${props => (props.isRight ? 'row-reverse' : 'row')};
    width: 100%;
    gap: 20px;
    align-items: center;
`
const PlayerImage = styled.img`
    width: 40px;
    height: 40px;
`

const PlayerName = styled.p<{ isRight: boolean }>`
    font-size: 1em;
    font-weight: 600;
    flex-grow: 5;
    text-align: ${props => (props.isRight ? 'right' : 'left')};
`

const PlayerStats = styled.p<{ isRight: boolean }>`
    font-size: 1em;
    font-weight: 600;
    flex-grow: 1;
    text-align: ${props => (props.isRight ? 'left' : 'right')};
`