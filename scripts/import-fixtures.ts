import { getPayload } from 'payload'

import config from '../payload.config'

/**
 * Imports the LSHC fixtures published on the Malta Handball livescore site
 * (https://livescore.maltahandball.com/league-matches/223 — Men Premier
 * Division, 2025/2026) into Payload.
 *
 * The source markup carries no team names, only crest filenames, so the three
 * clubs in that league were identified from their crests and are hard-coded
 * below against the crest id the site uses.
 *
 * Safe to re-run: teams, the competition and every fixture are matched on their
 * natural key and updated rather than duplicated.
 *
 *   pnpm import-fixtures
 */

const SEASON = '2025/2026'
const COMPETITION_NAME = 'Men Premier Division'
const COMPETITION_TYPE = 'League'

const TEAMS = {
  LSHC: { teamName: 'La Salle Handball Club', shortName: 'LSHC', slug: 'la-salle-handball-club' },
  SWQ: { teamName: 'Swieqi Phoenix Handball', shortName: 'SWQ', slug: 'swieqi-phoenix-handball' },
  KAV: { teamName: 'Kavallieri Handball Club', shortName: 'KAV', slug: 'kavallieri-handball-club' },
} as const

type TeamKey = keyof typeof TEAMS

/**
 * The eight league matches LSHC played. `matchId` is the id of the match page on
 * the source site and is what makes the fixture code stable across re-runs.
 * Kick-off times are as displayed on the site, i.e. Malta local time.
 */
const MATCHES: {
  matchId: number
  home: TeamKey
  away: TeamKey
  kickOff: string
  homeScore: number
  awayScore: number
}[] = [
  { matchId: 1102, home: 'SWQ', away: 'LSHC', kickOff: '2025-10-11T14:00', homeScore: 34, awayScore: 29 },
  { matchId: 1103, home: 'LSHC', away: 'KAV', kickOff: '2025-10-26T13:30', homeScore: 20, awayScore: 22 },
  { matchId: 1105, home: 'LSHC', away: 'SWQ', kickOff: '2025-12-07T15:00', homeScore: 29, awayScore: 26 },
  { matchId: 1106, home: 'KAV', away: 'LSHC', kickOff: '2025-12-14T12:30', homeScore: 22, awayScore: 22 },
  { matchId: 1109, home: 'LSHC', away: 'KAV', kickOff: '2026-01-31T14:00', homeScore: 34, awayScore: 35 },
  { matchId: 1108, home: 'SWQ', away: 'LSHC', kickOff: '2026-03-25T20:00', homeScore: 33, awayScore: 25 },
  { matchId: 1111, home: 'LSHC', away: 'SWQ', kickOff: '2026-03-28T13:00', homeScore: 27, awayScore: 26 },
  { matchId: 1112, home: 'KAV', away: 'LSHC', kickOff: '2026-04-18T15:30', homeScore: 33, awayScore: 33 },
]

/**
 * Turns a wall-clock time in Malta into a UTC instant, so that summer and winter
 * kick-offs both land on the right hour. Guesses the offset, then re-checks it
 * against how the candidate instant actually renders in Europe/Malta.
 */
const maltaTimeToUTC = (localTime: string): Date => {
  const [datePart, timePart] = localTime.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute] = timePart.split(':').map(Number)
  const asIfUTC = Date.UTC(year, month - 1, day, hour, minute)

  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Malta',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

  let candidate = asIfUTC
  for (let pass = 0; pass < 2; pass++) {
    const parts = Object.fromEntries(
      formatter.formatToParts(new Date(candidate)).map((p) => [p.type, p.value]),
    )
    const rendered = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour) % 24,
      Number(parts.minute),
    )
    if (rendered === asIfUTC) break
    candidate -= rendered - asIfUTC
  }

  return new Date(candidate)
}

const payload = await getPayload({ config })

// --- Competition type -------------------------------------------------------

const existingType = await payload.find({
  collection: 'competitionTypes',
  where: { competitionTypeName: { equals: COMPETITION_TYPE } },
  limit: 1,
})

const competitionType =
  existingType.docs[0] ??
  (await payload.create({
    collection: 'competitionTypes',
    data: { competitionTypeName: COMPETITION_TYPE },
  }))

// --- Competition ------------------------------------------------------------

const existingCompetition = await payload.find({
  collection: 'competitions',
  where: {
    and: [
      { competitionName: { equals: COMPETITION_NAME } },
      { season: { equals: SEASON } },
    ],
  },
  limit: 1,
})

const competition =
  existingCompetition.docs[0] ??
  (await payload.create({
    collection: 'competitions',
    data: {
      competitionName: COMPETITION_NAME,
      season: SEASON,
      competitionType: competitionType.id,
    },
  }))

// --- Teams ------------------------------------------------------------------

const teamIds = {} as Record<TeamKey, string>

for (const [key, team] of Object.entries(TEAMS) as [TeamKey, (typeof TEAMS)[TeamKey]][]) {
  const existing = await payload.find({
    collection: 'teams',
    where: { teamName: { equals: team.teamName } },
    limit: 1,
  })

  const doc = existing.docs[0]
    ? await payload.update({ collection: 'teams', id: existing.docs[0].id, data: team })
    : await payload.create({ collection: 'teams', data: team })

  teamIds[key] = String(doc.id)
  payload.logger.info(`Team ${existing.docs[0] ? 'updated' : 'created'}: ${team.teamName}`)
}

// --- Fixtures ---------------------------------------------------------------

for (const match of MATCHES) {
  const fixtureCode = `MHA-${match.matchId}`

  const data = {
    fixtureCode,
    homeTeam: teamIds[match.home],
    awayTeam: teamIds[match.away],
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    startDate: maltaTimeToUTC(match.kickOff).toISOString(),
    venue: 'USH' as const,
    status: 'Finished' as const,
    competition: competition.id,
  }

  const existing = await payload.find({
    collection: 'fixtures',
    where: { fixtureCode: { equals: fixtureCode } },
    limit: 1,
  })

  if (existing.docs[0]) {
    await payload.update({ collection: 'fixtures', id: existing.docs[0].id, data })
    payload.logger.info(`Fixture updated: ${fixtureCode} (${match.home} v ${match.away})`)
  } else {
    await payload.create({ collection: 'fixtures', data })
    payload.logger.info(`Fixture created: ${fixtureCode} (${match.home} v ${match.away})`)
  }
}

payload.logger.info(`Done — ${MATCHES.length} LSHC fixtures imported.`)

process.exit(0)
