"use client"

import { gql } from "@apollo/client"
import { useQuery, useSuspenseQuery } from "@apollo/experimental-nextjs-app-support/ssr"
import React from "react";

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

export default function ListTeams() {
    const { data, error } = useQuery<Response>(teams);

    return (
        <>
            {error ? (
                <p>Oh no, there was an error</p>
            ) : !data ? (
                <p>Loading...</p>
            ) : data ? (
                <div>
                    {data.teams.data.map((team) => (
                        <div key={team.id}>
                            {team.attributes.name}
                        </div>
                    ))}
                </div>
            ) : null}
        </>
    )
}