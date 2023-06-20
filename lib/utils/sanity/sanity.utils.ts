import { Team } from "@/lib/types/team.type";
import { client } from "./sanity.config";
import { groq } from "next-sanity";

export async function getTeams(): Promise<Team[]> {
    return await client.fetch(groq`*[_type == "team"]{
        _id, teamId, teamName, teamLogo
      }`);
}