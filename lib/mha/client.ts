/**
 * Client for the Malta Handball Association's public fixtures feed.
 *
 * The MHA web portal (https://maltahandball.com/webportal/fixtures/) is a
 * WordPress site whose fixtures page reads this JSON endpoint from the
 * browser. It needs no auth and returns every published fixture of the
 * current season across all clubs and categories.
 */

export const MHA_FIXTURES_ENDPOINT = 'https://maltahandball.com/wp-json/mha/v1/fixtures'

/** Status strings seen on the feed. Unknown values are tolerated, not rejected. */
export type MhaFixtureStatus = 'UPCOMING' | 'LIVE' | 'FINISHED' | 'ENDED' | (string & {})

export type MhaFixture = {
  /** Stable id, e.g. "MHA-FIX-2026-00520". Also exposed as `fixtureId` and `eventId`. */
  matchId: string
  /** "Fixture" or "Friendly". */
  eventType: string
  /** e.g. "COMP-MENSPREMIERLEAGUE"; empty for friendlies. */
  competitionId: string
  /** e.g. "Men's Premier League"; empty for friendlies. */
  competitionName: string
  /** Malta-local calendar date, "YYYY-MM-DD". */
  date: string
  /** Malta-local throw-off time, "HH:MM". */
  throwOff: string
  /** Hall short code ("USH", "LBSH"), a full name, or "TBC". */
  venue: string
  /** Category short code, e.g. "SM", "SW", "U15B". */
  category: string
  /** e.g. "TEAM-LASALLE-SM-001". Empty when the side is still to be decided. */
  homeTeamId: string
  /** Team name as entered for the season, usually the sponsor name ("La Salle Leapmotor"). */
  homeTeam: string
  /** Owning club's short name ("La Salle"), empty when undecided. */
  homeClub: string
  awayTeamId: string
  awayTeam: string
  awayClub: string
  status: MhaFixtureStatus
  homeScore: number | null
  awayScore: number | null
  isFinished: boolean
  isLive: boolean
}

export type MhaFixturesResponse = {
  success: boolean
  /** Full club name (lower-cased) → short club name, e.g. "la salle handball club" → "La Salle". */
  clubAliases: Record<string, string>
  fixtures: MhaFixture[]
  serverDateSort?: string
}

export const fetchMhaFixtures = async (): Promise<MhaFixturesResponse> => {
  const res = await fetch(`${MHA_FIXTURES_ENDPOINT}?_=${Date.now()}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
    signal: AbortSignal.timeout(30_000),
  })

  if (!res.ok) {
    throw new Error(`MHA fixtures feed returned HTTP ${res.status}`)
  }

  const data = (await res.json()) as Partial<MhaFixturesResponse>

  if (data?.success !== true || !Array.isArray(data.fixtures)) {
    throw new Error('MHA fixtures feed returned an unexpected payload')
  }

  return {
    success: true,
    clubAliases: data.clubAliases ?? {},
    fixtures: data.fixtures,
    serverDateSort: data.serverDateSort,
  }
}
