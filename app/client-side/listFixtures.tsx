"use client"

import Fixtures from "@/components/Fixture/Fixture";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/experimental-nextjs-app-support/ssr";
import React from "react";

const fixtures = gql`
    query GetFixtures{
        fixtures{
            data {
                id
                attributes {
                    competition {
                    data {
                        id 
                        attributes {
                        category {
                            data {
                            attributes {
                                name
                                
                            }
                            }
                        }
                        }
                    }
                    }
                    homeTeam {
                    data{
                        id 
                        attributes {
                        name
                        logo {
                            data {
                              attributes {
                                url
                              }
                            }
                          }
                        }
                    }
                    }
                    awayTeam {
                    data{
                        id 
                        attributes {
                        name
                        }
                    }
                    }
                    homeTeamScore
                    awayTeamScore
                    status
                    date
                    time      
                }
            }   
        }
    }
`;

export interface IFixtures {

    fixtures: {
        data: {
            id: number,
            attributes: {
                competition: {
                    data: {
                        id: number,
                        attributes: {
                            category: {
                                data: {
                                    attributes: {
                                        name: string                                        
                                    }
                                }
                            }
                        }
                    }
                }
                homeTeam: {
                    data: {
                        id: number
                        attributes: {
                            name: string
                            logo: {
                                data: {
                                    attributes: {
                                        url: string
                                    }
                                }[]
                            }
                        }
                    }
                }
                awayTeam: {
                    data: {
                        id: number
                        attributes: {
                            name: string
                        }
                    }
                }
            }
            homeTeamScore: number,
            awayTeamScore: number,
            status: string,
            date: Date,
            time: string
        }[]
    }
}

export default function ListFixtures() {
    const { data, error } = useQuery<IFixtures>(fixtures);

    return (
        <>
            {error ? (
                <p>Oh no, there was an error</p>
            ) : !data ? (
                <p>Loading...</p>
            ) : data ? (
                <Fixtures data={data} showTitle={false} />
            ) : null}
        </>
    )
}