
export interface IFixtureData {
    _id:           string;
    fixtureInfo:   IFixtureInfo;
    status:        string;
    startDate:     Date;
    endDate:       Date;
    venue:         string;
    broadcastInfo: string;
    season:        Date;
}

export interface IFixtureInfo {
    awayTeam:    ITeam;
    homeTeam:    ITeam;
    competition: ICompetition[];
    fixtureCode: string;
}

export interface ICareerStatistics {
    senior: ICareer;
}

export interface ICareer {
    team:   IClub;
    goals?: number;
}

export interface IClub {
    _ref:  string;
    _type: string;
}

export interface ITeam {
    team: {
        name:         string;
        _id:          string;
        categoryName: string;
        logo: {
            asset: {
                _ref: string;
            }
        }
    };
    players: IPlayer[];
}

export interface ICompetition {
    name:     string;
    category: ICategory;
}

export interface ICategory {
    _id:          string;
    categoryName: string;
}

export interface IPlayer {
    _id:              string;
    careerStatistics: ICareerStatistics;
    club:             IClub;
    goalsScored:      number;
    lastName:         string;
    firstName:        string;
    kitNumber: number;
}