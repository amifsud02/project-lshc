import { clientV2 } from "@/lib/utils/sanity/sanity.config";
import { groq } from "next-sanity";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, context: any) {

    try {
        const { year, category, competition } = context.params;

        const parsedYear = Number(year);
        const parsedCategory = category.charAt(0).toUpperCase() + category.slice(1);

        // Parse Competition
        let splitCompetition = competition.split('-');
        const parsedCompetition = splitCompetition.map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");

        const fixtures = await getFixtures(parsedYear, parsedCategory, parsedCompetition);
        console.log(parsedCompetition)
        return NextResponse.json(fixtures);    

    } catch (error) {
        return NextResponse.json(error);
    }

}

const getFixtures = async (year: number, category: string, competition: string) => {
    if(competition === 'All') {
        const query = groq`*[_type == "fixture" && season == $year && fixtureInfo.competition[0].category.categoryName == $category] | order(startDate desc)`
        const fixtures = await clientV2.fetch(query, {year, category});
        return fixtures;
    } else {
        const query = groq`*[_type == "fixture" && season == $year && fixtureInfo.competition[0].category.categoryName == $category && fixtureInfo.competition[0].name == $competition ] | order(startDate desc)`
        const fixtures = await clientV2.fetch(query, {year, category, competition});
        return fixtures;
    }
   

    
}