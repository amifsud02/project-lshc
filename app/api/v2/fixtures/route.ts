import { clientV2 } from "@/lib/utils/sanity/sanity.config";
import { groq } from "next-sanity";
import { NextRequest, NextResponse } from "next/server";
export async function GET(request: NextRequest) {
    try {
        const season = request.nextUrl.searchParams.get('season');
        const competition = request.nextUrl.searchParams.get('competition');
        const category = request.nextUrl.searchParams.get('category');
        const fixtureId = request.nextUrl.searchParams.get('id');
        const status = request.nextUrl.searchParams.get('status');  
        const isHomepage = Number(request.nextUrl.searchParams.get('isHomepage')) || 0;

        if(1 === isHomepage) {
            if(!season) {
                return createErrorResponse(400, 'Missing Season Parameter');
            }

            if(!competition) {
                return createErrorResponse(400, 'Missing Competition Parameter');
            }

            if(!category) {
                return createErrorResponse(400, 'Missing Category Parameter');
            }

            const fixtures = getFixturesForHomepage(2023, 'Men', 'Men');
            return NextResponse.json(fixtures);
        }

        return NextResponse.json({season, competition, category, fixtureId, status});
    } catch (error) {

    }
}

const createSuccessResponse = () => {
    
}

const createErrorResponse = (status: number, message: string) => {
    return NextResponse.json({status, message});
}

/**
 * Get All Fixtures
 * @param season 
 * @param category 
 */
const getAllFixtures = (season: number, category: string) => {
    
}

/**
 * Get Fixture give id
 * @param id 
 */
const getFixtureById = (id: string) => {
    // Return Fixture
}
/**
 * This function will return the latest fixture results and the upcoming fixtures
 * @param season 
 * @param competition 
 * @param category 
 */
const getFixturesForHomepage = (season: number, competition: string, category: string) => {
    const limit = 5; // This is the number of fixtures to be displayed on the homepage
    return {season, competition, category};
}

const getUpcomingFixtures = (season: number, category: string) => {
    const limit = 3 // This is the number of fixtures to be fetches as 'upcoming'
}

const getFixturesByCompetition = (season: number, competition: string, category: string) => {

}













































    // try {
    //     const query = groq`*[_type == "fixture" 
    //         && status == $status 
    //         && _id == 'dd518df2-3d1c-45c2-8d65-7d386413c57a' 
    //         && fixtureInfo.competition[0].name == 'National League'
    //         && fixtureInfo.competition[0].category.categoryName == 'Men'
    //     ]`;

    //     const matches = await clientV2.fetch(query, {
    //         status: 'Scheduled',
    //     });

    //     return NextResponse.json(matches);
    // } catch (error) {
    //     console.error(error);
    //     return NextResponse.json({ error: error }, { status: 500 });
    // }


// const query = groq`*[_type == "fixture" && status == $status && fixtureInfo.fixtureCode == $fixtureCode && fixtureInfo.competition.name == 'National League']`;