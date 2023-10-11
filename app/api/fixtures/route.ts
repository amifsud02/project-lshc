import { client } from "@/lib/utils/sanity/sanity.config";
import { groq } from "next-sanity";
import { NextResponse, NextRequest } from "next/server";

type GroupType = "men" | "women" | "u21-men" | "u21-women";

type ICompetitionDropdownItem = {
    [key: string]: {
      [key: string]: {
        key: string;
        value: string;
      };
    };
  }

export async function GET(request: NextRequest) {
    const allFixtures = request.nextUrl.searchParams.get("allfixtures");
    const season = request.nextUrl.searchParams.get("season");
    const limit = request.nextUrl.searchParams.get("limit");
    const limitQuery = limit ? `[0..${limit}-1]` : "";
    const isHomepage = request.nextUrl.searchParams.get("homepage") ?? false;

    if (!season) {
        return createErrorResponse('Missing "season" parameter.');
    }

    if (isHomepage === "true") {
        if (allFixtures) {
            return handleAllFixtures(allFixtures, season, "[0..4]", ["finished"]);  // Only 5 most recent 'finished' matches
        }

        const competitionTypeName = request.nextUrl.searchParams.get("competitiontypename");

        if(competitionTypeName) {
            return handleSingleCompetition(competitionTypeName, season, "", ["scheduled", "live"]); // Prioritize 'live'
        }
    } else {
        if (allFixtures) {
            return handleAllFixtures(allFixtures, season, limitQuery);
        }

        const competitionTypeName = request.nextUrl.searchParams.get("competitiontypename");

        if (!competitionTypeName) {
            return createErrorResponse('Missing "competitiontypename" parameter.');
        }
        return handleSingleCompetition(competitionTypeName, season, limitQuery);
    }
}

function createErrorResponse(message: string, statusCode: number = 400) {
    return NextResponse.json({ message, statusCode });
}

async function handleAllFixtures(allFixtures: string, season: string, limitQuery: string, status?: string[]) {
    const validGroups: GroupType[] = ["men", "women", "u21-men", "u21-women"];
    if (!validGroups.includes(allFixtures as GroupType)) {
        return createErrorResponse("Invalid 'allfixtures' parameter value.");
    }

    const competitionTypeNames = fetchCategoryValues(allFixtures);
    const query = createQuery("in", competitionTypeNames, season, limitQuery, status);
    const fixtures = await client.fetch(query, { season, competitionTypeNames });

    return NextResponse.json({ fixtures, competitionTypeNames });
}

async function handleSingleCompetition(competitionTypeName: string, season: string, limitQuery: string, status?: string[]) {
    const query = createQuery("==", [competitionTypeName], season, limitQuery, status);
    const fixtures = await client.fetch(query, { season, competitionTypeName });

    return NextResponse.json({ fixtures });
}

function createQuery(operator: "==" | "in", competitionTypeNames: string[], season: string, limitQuery: string, status?: string[]) {
    let statusFilter = status ? `&& status in ${JSON.stringify(status)}` : "";
    
    return groq`
  *[_type == "fixture" && competition->season == $season ${statusFilter} && competition->competitionType->competitionTypeName ${operator} $competitionTypeNames]{
      competition -> {
          competitionType -> {
              competitionTypeName
          },
          season
      },
      homeTeamId -> { 
        teamName, 
        teamLogo
      },
      homeScore,
      awayTeamId -> { 
        teamName, 
        teamLogo
      },
      awayScore,
      status,
      startDate,
      venue
  } | order(startDate desc)${limitQuery}`;
}

function fetchCategoryValues(group: string): string[] {
    const groupData = competitionDropdown[group];
    if (!groupData) {
        throw new Error(`Group '${group}' not found.`);
    }
    return Object.values(groupData).map(data => data.value);
}

const competitionDropdown: ICompetitionDropdownItem = {
    "men": {
        "national-league": {
            "key": "National League",
            "value": "Men's National League"
        },
        "premier-league": {
            "key": "Premier League",
            "value": "Men's Premier League"
        },
        "knockout": {
            "key": "Knockout",
            "value": "Men's Knock Out"
        },
        "louis-borg-cup": {
            "key": "Louis Borg Cup",
            "value": "Men's Louis Borg Cup"
        },
        "friendlies": {
            "key": "Friendlies",
            "value": "Men's Friendlies"
        }
    },
    "women": {
        "premiere-league": {
            "key": "Premier League",
            "value": "Women's Premier League"
        },
        "knockout": {
            "key": "Knockout",
            "value": "Women's Knock Out"
        },
        "louis-borg-cup": {
            "key": "Louis Borg Cup",
            "value": "Women's Louis Borg Cup"
        }
    },
    "u21-men": {
        "national-league": {
            "key": "National League",
            "value": "U21 Men's National League"
        },
        "knockout": {
            "key": "Knockout",
            "value": "U21 Men's Knock Out"
        }
    },
    "u21-women": {
        "national-league": {
            "key": "National League",
            "value": "U21 Women's National League"
        },
        "knockout": {
            "key": "Knockout",
            "value": "U21 Women's Knock Out"
        }
    }
}