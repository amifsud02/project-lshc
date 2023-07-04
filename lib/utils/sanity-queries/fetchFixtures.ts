import { groq } from "next-sanity";
import { client } from "../sanity/sanity.config";

export const fetchFixturesByCompetition = async () => {
    const query = groq`
    *[_type == "fixture"] {
        homeTeamId,
        homeScore,
    }`;

    const fixtures = await client.fetch(query);
    console.log(fixtures);
    return fixtures;
}
