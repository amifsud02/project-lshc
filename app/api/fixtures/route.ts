import { client } from "@/lib/utils/sanity/sanity.config";
import { groq } from "next-sanity";
import { NextResponse, NextRequest } from "next/server";

type ICompetitionDropdownItem = {
  [key: string]: {
      [key: string]: {
          key: string;
          value: string;
      };
  };
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

export async function GET(request: NextRequest) {
  const allFixtures = request.nextUrl.searchParams.get("allfixtures");
  const season = request.nextUrl.searchParams.get("season");
  const limit = request.nextUrl.searchParams.get("limit");
  const limitQuery = limit ? `[0..${limit}-1]` : "";

  type GroupType = "men" | "women" | "u21-men" | "u21-women";

  function fetchCategoryValues(group: string): string[] {
    const groupData = competitionDropdown[group];
    if (!groupData) {
      throw new Error(`Group '${group}' not found.`);
    }

    const values: string[] = [];
    for (const key in groupData) {
      if (groupData.hasOwnProperty(key)) {
        values.push(groupData[key].value);
      }
    }

    return values;
  }

  // Validate query parameters
  if (!season) {
    return NextResponse.json({
      message: "Missing 'season' parameter.",  
      statusCode: 400 
    });
  }

  if (allFixtures !== null) {
    const validGroups: GroupType[] = ["men", "women", "u21-men", "u21-women"];
    if (!validGroups.includes(allFixtures as GroupType)) {
      return NextResponse.json({ 
        message: "Invalid 'allfixtures' parameter value.", 
        statusCode: 400,
      });
    }

    const competitionTypeNames = fetchCategoryValues(allFixtures)
    const query = groq`
      *[_type == "fixture" && competition->season == $season && competition->competitionType->competitionTypeName in $competitionTypeNames]{
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
    const fixtures = await client.fetch(query, { season, competitionTypeNames });

    return NextResponse.json({
      fixtures,
    });
  } else {
    const competitionTypeName = request.nextUrl.searchParams.get("competitiontypename");
    if (!competitionTypeName) {
      return NextResponse.json({
        message: "Missing 'competitiontypename' parameter.",
        statusCode: 400,
      });
    }

    const query = groq`
      *[_type == "fixture" && competition->season == $season && competition->competitionType->competitionTypeName == $competitionTypeName]{
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
    const fixtures = await client.fetch(query, { season, competitionTypeName });

    return NextResponse.json({
      fixtures,
    });
  }
}