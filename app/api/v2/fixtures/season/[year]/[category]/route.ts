import { clientV2 } from "@/lib/utils/sanity/sanity.config";
import { groq } from "next-sanity";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, context: any) {
    console.log('YAHOOOOOO')
    try {
        const { year, category } = context.params;

        const parsedYear = Number(year);
        
        if(Number.isNaN(parsedYear)) {
            return NextResponse.json({'error': 'Year is not a valid number'}, {status: 400})
        }

        // Check for filters
        const isHomepage = Number(request.nextUrl.searchParams.get('isHomepage'));

        if(1 === isHomepage) {
            const fixtures = await getFixturesForHomepage(parsedYear, category);
            return NextResponse.json(fixtures);
        }

        const fixtures = await getAllFixtures(parsedYear, category);
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
    const finishedFixtures = await getFixturesStatusFinished(year, category, 5);
    const scheduledFixtures = await getFixturesStatusScheduled(year, category, 3);

    return {finishedFixtures, scheduledFixtures};
}

const getFixturesStatusFinished = async (year: number, category: string, limit?: number) => {
    const limitQuery = `[0..${limit}-1]`;
    const status = 'Completed';

    const query = groq`*[_type == "fixture" && season == $year && fixtureInfo.competition[0].category.categoryName == $category && status == $status] | order(startDate desc) ${limitQuery}`
    const fixtures = await clientV2.fetch(query, {year, category, status});

    return fixtures;
}

const getFixturesStatusScheduled = async (year: number, category: string, limit?: number) => {
    const limitQuery = `[0..${limit}-1]`;
    const status = 'Scheduled';

    const query = groq`*[_type == "fixture" && season == $year && fixtureInfo.competition[0].category.categoryName == $category && status == $status] | order(startDate desc) ${limitQuery}`
    const fixtures = await clientV2.fetch(query, {year, category, status});

    return fixtures;
}

/**
 * const referrer = request.headers.get('referer');

    if('http://localhost:3000/' !== referrer){
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const apiKey = 'HeyHeyMyG'
    const requestApiKey = request.headers.get('x-api-key');

    if (requestApiKey !== apiKey) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
 */
