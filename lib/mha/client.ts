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

/*
 * The same WordPress plugin serves per-match reports and per-player totals. Like
 * the fixtures feed they are public: the portal's match-report and leagues pages
 * read them from the browser.
 */

const MHA_API = 'https://maltahandball.com/wp-json/mha/v1'

const getJson = async (url: string): Promise<{ status: number; body: any }> => {
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
    signal: AbortSignal.timeout(30_000),
  })
  const body = await res.json().catch(() => null)
  return { status: res.status, body }
}

/** One row of a match report's team sheet. Times are match clock "MM:SS", empty when not given. */
export type MhaReportPlayer = {
  kit: string
  name: string
  /** Registration id, e.g. "MHA-LASP-008". The stable key players are linked on. */
  mhaId: string
  goals: number
  penaltyGiven: number
  penaltyScored: number
  yellowTime: string
  twoMin1: string
  twoMin2: string
  twoMin3: string
  redTime: string
  isMvp: boolean
}

export type MhaMatchReport = {
  matchId: string
  homeTeamId: string
  awayTeamId: string
  homeClub: string
  awayClub: string
  homeScore: number
  awayScore: number
  homePlayers: MhaReportPlayer[]
  awayPlayers: MhaReportPlayer[]
}

/**
 * The digital score sheet of a finished match. Resolves to `null` while the match
 * has not ended yet — MHA only publishes a report once the ticker closes it.
 */
export const fetchMhaMatchReport = async (matchId: string): Promise<MhaMatchReport | null> => {
  const { status, body } = await getJson(`${MHA_API}/match-report?matchId=${encodeURIComponent(matchId)}`)

  if (body?.code === 'mha_public_match_report_not_finished') return null
  if (status !== 200 || body?.success !== true || !body.reportData) {
    throw new Error(body?.message ?? `MHA match report returned HTTP ${status}`)
  }

  const report = body.reportData as MhaMatchReport
  return {
    ...report,
    homePlayers: Array.isArray(report.homePlayers) ? report.homePlayers : [],
    awayPlayers: Array.isArray(report.awayPlayers) ? report.awayPlayers : [],
  }
}

export type MhaPlayerTotals = {
  appearances: number
  goals: number
  penaltyGoals: number
  yellowCards: number
  suspensions: number
  redCards: number
  blueCards: number
  mvp: number
}

export type MhaPlayerStats = {
  playerId: string
  name: string
  seasonName: string
  /** Every competition of the requested season, not only the matches we sync. */
  totals: MhaPlayerTotals
  careerTotals: MhaPlayerTotals
}

/** The season MHA currently marks active, e.g. `{ seasonId: "S001", seasonName: "2026 - 2027" }`. */
export const fetchMhaActiveSeason = async (): Promise<{ seasonId: string; seasonName: string } | null> => {
  const { status, body } = await getJson(`${MHA_API}/leagues`)
  if (status !== 200 || body?.success !== true) {
    throw new Error(body?.message ?? `MHA leagues returned HTTP ${status}`)
  }
  const seasons: { seasonId: string; seasonName: string; active?: boolean }[] = body.data?.seasons ?? []
  return seasons.find((s) => s.active) ?? null
}

export const fetchMhaPlayerStats = async (playerId: string, seasonId: string): Promise<MhaPlayerStats> => {
  const params = new URLSearchParams({ action: 'player', playerId, seasonId })
  const { status, body } = await getJson(`${MHA_API}/leagues?${params}`)
  if (status !== 200 || body?.success !== true || !body.data?.totals) {
    throw new Error(body?.message ?? `MHA player stats returned HTTP ${status}`)
  }
  return body.data as MhaPlayerStats
}
