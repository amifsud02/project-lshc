const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

// const newTeams = [
//     {
//         name: 'Hamrun',
//         logo: 'https://i.postimg.cc/x1qd4st0/Hamrun.png',
//         country: 'Malta'
//     },
//     {
//         name: 'Kavallieri',
//         logo: 'https://i.postimg.cc/65M3zsVj/Kavallieri.png',
//         country: 'Malta'
//     },
//     {
//         name: 'HMS',
//         logo: 'https://thumbs2.imgbox.com/e0/5c/IZc6QwOm_t.png',
//         country: 'Malta'
//     },
//     {
//         name: 'Zebbug',
//         logo: 'https://i.postimg.cc/zBYX3q5B/Zebbug.png',
//         country: 'Malta'
//     },
//     {
//         name: 'Aloysians',
//         logo: 'https://thumbs2.imgbox.com/b0/a8/QcihpPaN_t.png',
//         country: 'Malta'
//     },
//     {
//         name: 'Phoenix',
//         logo: 'https://i.postimg.cc/VNCkYdxp/Phoenix.png',
//         country: 'Malta'
//     },
//     {
//         name: 'Valletta',
//         logo: 'https://i.postimg.cc/65M3zsVj/Kavallieri.png',
//         country: 'Malta'
//     },

// ]

// const categories = [
//     {
//         name: 'Men'
//     },
//     {
//         name: 'Women'
//     },
//     {
//         name: 'U21 Men'
//     },
//     {
//         name: 'U21 Women'
//     }

// ]

// async function main() {
//     const team = categories.map(async (c) => 
//         await prisma.category.create({
//             data: c
//         })
//     )
// }

// main()
//     .then(async () => {
//         await prisma.$disconnect()
//     })
//     .catch(async (e) => {
//         console.log(e)
//         await prisma.$disconnect()
//         process.exit(1)
//     })

// async function createSeasonAndCompetition() {
//     const season = await prisma.season.create({
//         data: {
//             year: 2022,
//             competitions: {
//                 create: {
//                     name: 'National League',
//                     category: {
//                         connect: {
//                             id: '849b9ab5-c88f-462a-98d6-1bd70e4e18c5'
//                         }
//                     },
//                     fixtures: {
//                         create: [
//                             {
//                                 homeTeam: {
//                                     connect: {
//                                         id: '7c6ace77-6621-4480-8607-d7a9248528ff'
//                                     }
//                                 },
//                                 awayTeam: {
//                                     connect: {
//                                         id: 'b73712e9-6661-4971-adc8-cd3afe636e52'
//                                     }
//                                 },
//                                 homeTeamScore: 0,
//                                 awayTeamScore: 0,
//                                 date: new Date(),
//                                 location: 'USH',
//                                 time: '19:00',
//                                 status: 'Scheduled'
//                             }
//                         ]
//                     },
//                     leaderboard: {
//                         create: {
//                             teams: {
//                                 create: [
//                                     {
//                                         team: {
//                                             connect: {
//                                                 id: '7c6ace77-6621-4480-8607-d7a9248528ff'
//                                             }
//                                         },
//                                         wins: 0,
//                                         losses: 0,
//                                         draws: 0,
//                                         goalsFor: 0,
//                                         goalsAgainst: 0
//                                     },
//                                     {
//                                         team: {
//                                             connect: {
//                                                 id: 'b73712e9-6661-4971-adc8-cd3afe636e52'
//                                             }
//                                         },
//                                         wins: 0,
//                                         losses: 0,
//                                         draws: 0,
//                                         goalsFor: 0,
//                                         goalsAgainst: 0
//                                     }
//                                 ]
//                             }
//                         }
//                     }
//                 }
//             }
//         },
//         include: {
//             competitions: {
//                 include: {
//                     leaderboard: {
//                         include: {
//                             teams: {
//                                 include: {
//                                     team: true
//                                 }
//                             }
//                         }
//                     }
//                 }
//             }
//         }
//     })

//     console.log("Season and Competition Created: ")
//     console.log(season)
// }

// createSeasonAndCompetition()
//     .catch((error) => {
//         console.error(error);
//     })
//     .finally(async () => {
//         await prisma.$disconnect();
//     });

async function fetchSeasonAndCompetition() {
    const season = await prisma.season.findFirst({
      where: {
        year: 2022
      },
      include: {
        competitions: {
          include: {
            leaderboard: {
              include: {
                teams: {
                  include: {
                    team: true
                  }
                }
              }
            },
            fixtures: true
          }
        }
      }
    });
  
    console.log('Fetched Season and Competition:');
    console.log(season);
  }
  
  fetchSeasonAndCompetition()
    .catch((error) => {
      console.error(error);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });