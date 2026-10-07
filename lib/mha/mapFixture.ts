import type { Fixture } from '@/payload-types'
import { maltaTimeToUTC } from '@/lib/utils/maltaTime'

import type { MhaFixture } from './client'

/**
 * Pure translation of one MHA feed fixture into the shape of our `fixtures`
 * collection. Relationships are returned as natural keys (MHA team id, competition
 * name + season) and resolved to Payload ids by `syncMhaFixtures`, which keeps
 * this file free of database access and easy to reason about.
 */

/** Category short codes as listed by https://maltahandball.com/wp-json/mha/v1/categories. */
export const MHA_CATEGORY_LABELS: Record<string, string> = {
  SM: 'Senior Men',
  SW: 'Senior Women',
  U8: 'U8',
  U10: 'U10',
  U13: 'U13',
  U15B: 'U15 Boys',
  U15G: 'U15 Girls',
  U17B: 'U17 Boys',
  U17G: 'U17 Girls',
  U19M: 'U19 Men',
  U19W: 'U19 Women',
}

type Venue = Fixture['venue']
type Status = Fixture['status']

/** MHA writes halls either as a short code or in full; anything unrecognised falls back to TBC. */
const VENUES: Record<string, Venue> = {
  USH: 'USH',
  'UNIVERSITY SPORTS HALL': 'USH',
  SHPH: 'SHPH',
  LBSH: 'LBSH',
  KSH: 'KSH',
  'KIRKOP SPORTS HALL': 'KSH',
  TBC: 'TBC',
  '': 'TBC',
}

export type MhaTeamRef = {
  /** e.g. "TEAM-LASALLE-SM-001" — the stable key teams are linked on. */
  mhaTeamId: string
  /** Season team name with MHA's disambiguating trailing dot removed, e.g. "La Salle". */
  name: string
  /** Owning club's short name, e.g. "La Salle". */
  club: string
}

export type MappedFixture = {
  fixtureCode: string
  startDate: string
  venue: Venue
  status: Status
  homeScore: number
  awayScore: number
  home: MhaTeamRef
  away: MhaTeamRef
  competition: {
    competitionName: string
    season: string
    competitionTypeName: string
  }
  warnings: string[]
}

export type MapResult = { ok: true; fixture: MappedFixture } | { ok: false; reason: string }

/** Handball seasons run September to May, so August onwards belongs to the next season. */
export const seasonForDate = (date: string): string => {
  const [year, month] = date.split('-').map(Number)
  return month >= 8 ? `${year}/${year + 1}` : `${year - 1}/${year}`
}

export const mapStatus = (mha: Pick<MhaFixture, 'status' | 'isFinished'>): Status => {
  const status = String(mha.status ?? '').toUpperCase()
  if (mha.isFinished || status === 'FINISHED' || status === 'ENDED') return 'Finished'
  if (status === 'POSTPONED') return 'Postponed'
  if (status === 'CANCELLED' || status === 'CANCELED') return 'Cancelled'
  // UPCOMING and LIVE: there is no live state in our schema, so a match in
  // progress stays Scheduled until the feed reports it finished.
  return 'Scheduled'
}

export const mapVenue = (venue: string): Venue | undefined =>
  VENUES[String(venue ?? '').trim().toUpperCase()]

export const competitionTypeFor = (competitionName: string): string => {
  if (/knock\s*-?\s*out/i.test(competitionName)) return 'Knockout'
  if (/\bcup\b/i.test(competitionName)) return 'Cup'
  if (/\bleague\b/i.test(competitionName)) return 'League'
  if (/tournament/i.test(competitionName)) return 'Tournament'
  return 'Friendly'
}

/**
 * MHA's competition names mostly carry the category already ("U15 Boys' League"),
 * but some are shared across categories ("Pre-Season Tournament" runs for both
 * senior men and women). Those get the category prefixed so each one becomes its
 * own competition rather than mixing men's and women's results.
 */
export const competitionNameFor = (mha: Pick<MhaFixture, 'competitionName' | 'category'>): string => {
  const label = MHA_CATEGORY_LABELS[mha.category] ?? mha.category
  const name = String(mha.competitionName ?? '').trim()

  if (!name) return `${label} Friendlies`
  if (/\b(men|women|boys|girls|u\d+)/i.test(name)) return name
  return `${label} ${name}`
}

const cleanTeamName = (name: string) => String(name ?? '').trim().replace(/\.+$/, '').trim()

const teamRef = (id: string, name: string, club: string): MhaTeamRef | null => {
  const cleaned = cleanTeamName(name)
  if (!id || !cleaned) return null
  return { mhaTeamId: id, name: cleaned, club: String(club ?? '').trim() }
}

export const mapMhaFixture = (mha: MhaFixture): MapResult => {
  if (!mha.matchId) return { ok: false, reason: 'missing matchId' }

  const home = teamRef(mha.homeTeamId, mha.homeTeam, mha.homeClub)
  const away = teamRef(mha.awayTeamId, mha.awayTeam, mha.awayClub)
  if (!home || !away) return { ok: false, reason: 'teams not yet decided' }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(mha.date ?? '')) {
    return { ok: false, reason: `unparseable date "${mha.date}"` }
  }

  const warnings: string[] = []

  // A missing throw-off is stored as midnight Malta time, i.e. "date only".
  const throwOff = /^\d{2}:\d{2}$/.test(mha.throwOff ?? '') ? mha.throwOff : '00:00'
  if (throwOff !== mha.throwOff) warnings.push(`no throw-off time ("${mha.throwOff}")`)

  let venue = mapVenue(mha.venue)
  if (!venue) {
    warnings.push(`unknown venue "${mha.venue}", saved as TBC`)
    venue = 'TBC'
  }

  const competitionName = competitionNameFor(mha)

  return {
    ok: true,
    fixture: {
      fixtureCode: mha.matchId,
      startDate: maltaTimeToUTC(`${mha.date}T${throwOff}`).toISOString(),
      venue,
      status: mapStatus(mha),
      homeScore: Number(mha.homeScore ?? 0) || 0,
      awayScore: Number(mha.awayScore ?? 0) || 0,
      home,
      away,
      competition: {
        competitionName,
        season: seasonForDate(mha.date),
        competitionTypeName: mha.eventType === 'Friendly' ? 'Friendly' : competitionTypeFor(competitionName),
      },
      warnings,
    },
  }
}
