import { client } from "@/lib/utils/sanity/sanity.config";
import { groq } from "next-sanity";
import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    const season = request.nextUrl.searchParams.get("season")

    const competitionTypeName = request.nextUrl.searchParams.get('competitiontypename')

    const query = groq`
    *[_type == "standing" && competition->season == $season && competition->competitionType->competitionTypeName == $competitionTypeName]{
        competition -> {
            competitionType -> {
                competitionTypeName
            },
            season
        },
        teams[] {
        position,
        _key,
        draws,
        matchesPlayed,
        losses,
        points,
        wins,
        team -> {
            teamName,
            teamLogo
        },
        goalDifference
        }
    }`;

    const standings = await client.fetch(query, { season, competitionTypeName });

    return NextResponse.json({
        standings: standings,
    });
}
    

    //competition->competitionType->competitionTypeName == $competitionTypeName &&

    
