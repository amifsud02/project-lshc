import { clientV2 } from "@/lib/utils/sanity/sanity.config";
import { groq } from "next-sanity";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, context: any) {
    try {
        const { year, category } = context.params;

        const parsedYear = Number(year);
        
        if(Number.isNaN(parsedYear)) {
            return NextResponse.json({'error': 'Year is not a valid number'}, {status: 400})
        }

        // Check for filters
        const isHomepage = Number(request.nextUrl.searchParams.get('isHomepage'));

        const fixtures = isHomepage === 1
            ? await getFixturesForHomepage(parsedYear, category)
            : await getAllFixtures(parsedYear, category);

        return NextResponse.json(fixtures);
    } catch (error) {
        return NextResponse.json(error);
    }
}

const getAllFixtures = async (year: number, category: string) => {
    const query = groq`*[_type == "fixture" && season == $year && fixtureInfo.competition[0].category.categoryName == $category]`
    const fixtures = await clientV2.fetch(query, {year, category})
    return fixtures;
}

const getFixturesForHomepage = async (year: number, category: string) => {
    const finishedFixtures = await getFixturesStatus(year, category, 'Completed', 5);
    const scheduledFixtures = await getFixturesStatus(year, category, 'Scheduled', 3);

    return {finishedFixtures, scheduledFixtures};
}

const getFixturesStatus = async (year: number, category: string, status: string, limit?: number) => {
    const limitQuery = `[0..${limit}-1]`;

    const query = groq`*[_type == "fixture" && season == $year && fixtureInfo.competition[0].category.categoryName == $category && status == $status] | order(startDate desc) ${limitQuery}`
    const fixtures = await clientV2.fetch(query, {year, category, status});

    return fixtures;
}   