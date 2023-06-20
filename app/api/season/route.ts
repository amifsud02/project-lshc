import prisma from "@/lib/prisma";

export async function GET() {
    const season = await prisma.season.findFirst({
        where: {
            year: 2022
        },
        include: {
            competitions: {
                include: {
                    category: true,
                    leaderboard: {
                        include: {
                            teams: {
                                include: {
                                    team: true
                                }
                            }
                        }
                    },
                    fixtures: {
                        include: {
                            homeTeam: true,
                            awayTeam: true
                        }
                    }
                }
            }
        }
    });


    return Response.json({
        season
    })
}
