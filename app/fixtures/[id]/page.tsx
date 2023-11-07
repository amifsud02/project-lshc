import React from "react";
import { MapPin } from "lucide-react";
import Navbar from "@/components/Hero/Navbar";
import Footer from "@/components/Footer/Footer";
import { Metadata, ResolvingMetadata } from "next";
import { Partners } from "@/components/Partners/Partners";
import { IFixtureData, IPlayer } from "@/lib/types/fixture-info.type";
import { clientV2, imageBuilderV2 } from "@/lib/utils/sanity/sanity.config";
import { FixtureHeader, HeaderContent, Top, Middle, Team, TeamName, TeamLogo, TimeScore, Bottom, PlayerContent, PlayerImage, PlayerName, PlayerStats, LineUpWrapper, LineUpTitle, Divider, LineUpContainer, LineUpColumn, LineUpHeader, Goals, TeamStats, TeamNameStats } from "@/components/Fixture/SinglePageComponents";

import dynamic from "next/dynamic";
import { YouTubePlayer } from "@/components/Fixture/MediaPlayer/VideoPlayer";

const DynamicCountdown = dynamic(() => import('../../../components/Countdown/CountdownTimer'), {
    ssr: false,
    loading: () => <></>
})

const getData = async (id: string) => {
    const query = `*[_type == "fixture" && _id == "${id}"]`;
    const data = await clientV2.fetch(query,
        {
            next: {
                revalidate: 3600
            }
        });

    return data;
}

const baseSiteUrl = process.env.NEXT_PUBLIC_API_URL;

type Props = {
    params: { id: string }
    searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata(
    { params, searchParams }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {

    const id = params.id
    const fixtureData = (await getData(id))[0] as IFixtureData;

    const { homeTeam, awayTeam } = fixtureData?.fixtureInfo
    const { competition } = fixtureData?.fixtureInfo;
    const { season } = fixtureData;

    const teams = `${homeTeam.team.name} - ${awayTeam.team.name}`
    const year = getYear(season.toString());

    const canonical = `${baseSiteUrl}/fixtures/${id}`;
    const title = `${teams}: Handball ${competition[0].name} ${competition[0].category.categoryName} ${year}  fixture | La Salle Handball`;
    const description = `Explore live handball streams, stats, and stay updated with the latest results and rankings from ${competition[0].name} ${competition[0].category.categoryName} ${year} fixture: ${teams}`
    return {
        title: title,
        description: description,
        alternates: {
            canonical: canonical
        },
        openGraph: {
            title: title,
            description: description,

            url: canonical,
        }
    }
};

const getYear = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const previousYear = (year - 1).toString() // Extract the last two digits of the next year
    return `${previousYear}/${year.toString().slice(-2)}`;
}

const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    const timeObj = date.toLocaleString("de-De", { timeZone: "Europe/Berlin" })
    const timeParts = timeObj.split(', ')[1].split(':');
    console.log(timeObj);

    const hour = timeParts[0];
    const minute = timeParts[1];

    // Get the day name, date, and month name
    const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
    const day = date.getDate();
    const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(date);
    const year = date.getFullYear();

    // Get the hours and minutes, ensuring they are two digits
    const hours = ("0" + date.getHours()).slice(-2);
    const minutes = ("0" + date.getMinutes()).slice(-2);

    // Construct the formatted date string
    const formattedDate = `${dayName} ${day} ${monthName} ${year}`;
    const formattedTime = `${hour}:${minute}`;

    return {
        formattedDate,
        formattedTime
    }
}

const FixturePageHeader: React.FC<{ fixtureData: IFixtureData }> = ({ fixtureData }) => {

    const { homeTeam, awayTeam } = fixtureData?.fixtureInfo;
    const dateTime = formatDate(fixtureData.startDate.toString());

    const today = new Date();

    return (
        <header>
            <FixtureHeader>
                <Navbar />
                <div className='parent fixtures-page'>
                    <HeaderContent>
                        <Top>
                            <div className="numbers">{dateTime.formattedDate}</div>
                            <div style={{ display: 'inline-flex' }}><MapPin height={'16px'} /> {fixtureData.venue}</div>
                        </Top>
                        <Middle>
                            <Team isSecond={false}>
                                <TeamName>{homeTeam.team.name}</TeamName>
                                <TeamLogo src={imageBuilderV2.image(homeTeam.team.logo).url()} />
                            </Team>

                            <TimeScore className="numbers">
                                {fixtureData.status === 'Completed' ? `${fixtureData.homeScore} - ${fixtureData.awayScore}` : dateTime.formattedTime}
                            </TimeScore>

                            <Team isSecond={true}>
                                <TeamName>{awayTeam.team.name}</TeamName>
                                <TeamLogo src={imageBuilderV2.image(awayTeam.team.logo).url()} />
                            </Team>
                        </Middle>

                        <Bottom className="numbers">
                            {
                                new Date(fixtureData.startDate) >= today &&
                                <>
                                    <h2>The match will start in:</h2>
                                    <DynamicCountdown targetDate={fixtureData.startDate} />
                                </>
                            }
                        </Bottom>
                    </HeaderContent>
                </div>
            </FixtureHeader>
        </header>
    )
}

import playerFallbackImage from '@/public/lshc-avatar.svg';
import Image from "next/image";

const PlayerInfo: React.FC<{ player: IPlayer, isRight: boolean }> = ({ player, isRight }) => {
    return (
        <PlayerContent isRight={isRight}>
            <PlayerImage>
                <Image src={playerFallbackImage} alt="" fill={true} />
            </PlayerImage>
            <PlayerName isRight={isRight}>{player.firstName} {player.lastName}</PlayerName>
            <PlayerStats className="numbers" isRight={isRight}>{player.goalsScored > 0 ? player.goalsScored : 0}</PlayerStats>
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

            {fixtureData.broadcastInfo &&
                <section className="parent">
                        <div className="aspect-video">
                            <YouTubePlayer videoId={fixtureData.broadcastInfo}/>
                        </div>
                </section>
            }

            <article className="parent">
                {(homeTeamPlayers.length <= 5 || awayTeamPlayers.length <= 5) ? (
                    <p style={{ textAlign: 'center' }}>Line Up Not Available</p>
                ) : (
                    <LineUpWrapper>
                        <LineUpTitle>Lineup</LineUpTitle>
                        <Divider />
                        <LineUpContainer>
                            <LineUpColumn>
                                <TeamStats isSecond={false} style={{ marginBottom: '20px' }}>
                                    <TeamNameStats>{homeTeam.team.name}</TeamNameStats>
                                    {homeTeam.team.hasOwnProperty("logo") ?
                                        <TeamLogo src={imageBuilderV2.image(homeTeam.team.logo).url()} /> : ''
                                    }
                                </TeamStats>
                                <LineUpHeader>
                                    <Goals style={{ flexGrow: '1' }} isRight={true}>Goals</Goals>
                                </LineUpHeader>
                                {homeTeam && homeTeam.players.slice().sort((a, b) => (b.goalsScored || 0) - (a.goalsScored || 0)).map((player: IPlayer) => (
                                    <PlayerInfo key={player._id} player={player} isRight={false} />
                                ))}
                            </LineUpColumn>

                            <LineUpColumn>
                                <TeamStats isSecond={true} style={{ marginBottom: '20px' }}>
                                    <TeamNameStats>{awayTeam.team.name}</TeamNameStats>
                                    {awayTeam.team.hasOwnProperty("logo") ?
                                        <TeamLogo src={imageBuilderV2.image(awayTeam.team.logo).url()} /> : ''
                                    }
                                </TeamStats>
                                <LineUpHeader>
                                    <Goals style={{ flexGrow: '1' }} isRight={false}>Goals</Goals>
                                </LineUpHeader>
                                {awayTeam.players && awayTeam.players.slice().sort((a, b) => (b.goalsScored || 0) - (a.goalsScored || 0)).map((player: IPlayer) => (
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

// eslint-disable-next-line @next/next/no-async-client-component
export default async function FixturePage({ params }: { params: { id: string } }) {
    const { id } = params;
    const fixtureData = (await getData(id))[0] as IFixtureData;

    return (
        <FixturePageContent fixtureData={fixtureData} />
    )

}

