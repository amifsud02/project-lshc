import { ITeam } from "./team.type";

export type IStanding = {
    competition: {
        competitionType: {
            competitionTypeName: string
        },
        season: number;
    };
    teams: ITeamStats[]
}

export type ITeamStats = {
    team: ITeam;
    matchesPlayed: number;
    wins: number;
    draws: number;
    losses: number;
    points: number;
    goalDifference: number;
}