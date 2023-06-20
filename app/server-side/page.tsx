import { getClient } from "@/lib/utils/apollo/apollo-client";
import { gql } from '@apollo/client';
import React from "react";

export const dynamic = "force-dynamic";

const teams = gql`
  query GetTeams {
    teams {
      data {
        id
        attributes {
          name
          country        
        }
      }
    }
  }
`;

interface Response {
    teams: {
        data: {
          id: number,
          attributes: {
            name: string,
            country: string
          }
        }[]
      }
}

export default async function ServerSide() {
    const data = await getClient().query<Response>({
        query: teams
    })

    return (
        data.data.teams.data.map((team) => (
            <div key={team.id}>
                {team.attributes.name}
            </div>
        ))
    )
}
