import { client } from "@/lib/utils/sanity/sanity.config";
import { groq } from "next-sanity";
import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const season = request.nextUrl.searchParams.get("season")
  const competitionTypeName = request.nextUrl.searchParams.get('competitiontypename')
  const limit = request.nextUrl.searchParams.get("limit")

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
        
    } | order(startDate desc)[0..${limit}-1]`;

  const fixtures = await client.fetch(query, { season, competitionTypeName });

  //competition->competitionType->competitionTypeName == $competitionTypeName &&

  return NextResponse.json({
    fixtures,
  });
}
