import { ITeam } from "./team.type";

export type IFixture = {
    homeTeamId: ITeam;
    awayTeamId: ITeam;
    homeScore: number;
    awayScore: number;
    status: string;
    venue: string;
    startDate: Date;
  };