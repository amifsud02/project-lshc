import { ITeam } from "./team.type";

export type IFixture = {
  _id: string;
  fixtureInfo: IFixtureInfo;
  homeScore: number;
  awayScore: number;
  season: number;
  status: string;
  venue: string;
  startDate: Date;
  endDate: Date;
};

export type IFixtureInfo = {
  homeTeam:  {
    team: ITeam;
    score: number;
  };
  awayTeam:  {
    team: ITeam;
    score: number;
  };
  competition: ICompetition[];
  fixtureCode: string;
}

export interface ICategory {
  _id: string;
  categoryName: string;
}

export type ICompetition = {
  category: ICategory;
  name: string;
}