import type { Payload } from 'payload'

import { slugify } from '@/lib/utils/fixtureSlug'

import {
  fetchMhaActiveSeason,
  fetchMhaFixtures,
  fetchMhaMatchReport,
  fetchMhaPlayerStats,
  type MhaFixture,
  type MhaMatchReport,
} from './client'
import { mapMhaFixture, type MappedFixture, type MhaTeamRef } from './mapFixture'
import { mapLineup, nameKey, splitName, type MappedLineupRow } from './mapLineup'

/** The club whose fixtures are pulled in, as named in the feed's `homeClub` / `awayClub`. */
export const MHA_CLUB_NAME = 'La Salle'

export type SyncAction = 'created' | 'updated' | 'unchanged' | 'skipped' | 'error'

export type SyncItem = {
  fixtureCode: string
  label: string
  action: SyncAction
  detail?: string
}

export type SyncResult = {
  dryRun: boolean
  fetched: number
  considered: number
  counts: Record<SyncAction, number>
  teamsCreated: string[]
  teamsLinked: string[]
  competitionsCreated: string[]
  items: SyncItem[]
  lineups: {
    /** Finished fixtures whose line-ups were written (or would be, in a dry run). */
    saved: number
    unchanged: number
    /** Finished on the feed, but MHA has not published the match report yet. */
    pending: number
    failed: number
  }
  playersCreated: string[]
  playersLinked: string[]
  playerStats: {
    season: string | null
    updated: number
    unchanged: number
    failed: number
  }
  /** Problems that did not stop the sync, e.g. a match report that failed to load. */
  warnings: string[]
}

export type SyncOptions = {
  dryRun?: boolean
  /**
   * Re-read the match report of every finished fixture, not only those without a
   * line-up yet. For when MHA corrects a score sheet after the fact.
   */
  refreshLineups?: boolean
}

type LineupJob = {
  /** Null for a fixture a dry run would create — there is nothing to write to. */
  fixtureId: string | null
  matchId: string
  label: string
  homeTeam: string
  awayTeam: string
  homeIsOurs: boolean
  awayIsOurs: boolean
  existing: { homeLineup?: unknown; awayLineup?: unknown } | null
}

type LineupRow = MappedLineupRow & { player: string | null }

/** MHA's server is a small WordPress install; keep parallel requests modest. */
const MHA_CONCURRENCY = 4

type Id = string | number

const idOf = (value: unknown): string | null => {
  if (value == null) return null
  if (typeof value === 'object') return idOf((value as { id?: Id }).id)
  return String(value)
}

const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase())

/**
 * Pulls the MHA fixtures feed and upserts every La Salle fixture into Payload.
 *
 * - Fixtures are matched on `fixtureCode` (the MHA match id), so re-running only
 *   writes what changed. Fixtures that disappear from the feed are left alone.
 * - Teams are linked through their `mhaTeamIds`. A team seen for the first time
 *   is matched by name — a club's first team ("…-001") against the club's full
 *   name, so it lands on the existing "La Salle Handball Club" rather than this
 *   season's sponsor name — and only created when nothing matches.
 * - Competitions are matched on name + season and created as needed.
 * - Finished fixtures get both line-ups with each player's goals, 7m, cards and
 *   suspensions from the MHA match report. Reports are only read for fixtures
 *   without a line-up yet (or all of them with `refreshLineups`).
 * - La Salle players on those line-ups are linked through `mhaPlayerId` — matched
 *   by name the first time, created when nothing matches — and every linked
 *   player's season totals are refreshed from MHA.
 *
 * With `dryRun` nothing is written; the result reports what would happen.
 */
export const syncMhaFixtures = async (
  payload: Payload,
  { dryRun = false, refreshLineups = false }: SyncOptions = {},
): Promise<SyncResult> => {
  const feed = await fetchMhaFixtures()

  // "la salle handball club" → "La Salle", inverted so a short club name finds its full name.
  const clubFullNames = new Map(
    Object.entries(feed.clubAliases).map(([full, short]) => [short.toLowerCase(), titleCase(full)]),
  )

  const ours = feed.fixtures.filter(
    (f: MhaFixture) => f.homeClub === MHA_CLUB_NAME || f.awayClub === MHA_CLUB_NAME,
  )

  const result: SyncResult = {
    dryRun,
    fetched: feed.fixtures.length,
    considered: ours.length,
    counts: { created: 0, updated: 0, unchanged: 0, skipped: 0, error: 0 },
    teamsCreated: [],
    teamsLinked: [],
    competitionsCreated: [],
    items: [],
    lineups: { saved: 0, unchanged: 0, pending: 0, failed: 0 },
    playersCreated: [],
    playersLinked: [],
    playerStats: { season: null, updated: 0, unchanged: 0, failed: 0 },
    warnings: [],
  }

  const lineupJobs: LineupJob[] = []

  const teamCache = new Map<string, string>()
  const competitionCache = new Map<string, string>()
  const competitionTypeCache = new Map<string, string>()

  const resolveTeam = async (ref: MhaTeamRef): Promise<string> => {
    const cached = teamCache.get(ref.mhaTeamId)
    if (cached) return cached

    const linked = await payload.find({
      collection: 'teams',
      where: { mhaTeamIds: { in: [ref.mhaTeamId] } },
      limit: 1,
      depth: 0,
    })
    if (linked.docs[0]) {
      teamCache.set(ref.mhaTeamId, String(linked.docs[0].id))
      return String(linked.docs[0].id)
    }

    const clubFullName = clubFullNames.get(ref.club.toLowerCase())
    const isFirstTeam = /-001$/.test(ref.mhaTeamId)
    const candidates = [...new Set([isFirstTeam ? clubFullName : undefined, ref.name].filter(Boolean))] as string[]

    for (const teamName of candidates) {
      const { docs } = await payload.find({
        collection: 'teams',
        where: { teamName: { equals: teamName } },
        limit: 1,
        depth: 0,
      })
      const match = docs[0]
      if (!match) continue

      if (!dryRun) {
        await payload.update({
          collection: 'teams',
          id: match.id,
          data: { mhaTeamIds: [...(match.mhaTeamIds ?? []), ref.mhaTeamId] },
        })
      }
      result.teamsLinked.push(`${ref.mhaTeamId} → ${match.teamName}`)
      teamCache.set(ref.mhaTeamId, String(match.id))
      return String(match.id)
    }

    const teamName = candidates[0]
    result.teamsCreated.push(`${teamName} (${ref.mhaTeamId})`)

    if (dryRun) {
      const placeholder = `new-team:${ref.mhaTeamId}`
      teamCache.set(ref.mhaTeamId, placeholder)
      return placeholder
    }

    const slug = await uniqueTeamSlug(payload, teamName)
    const created = await payload.create({
      collection: 'teams',
      data: { teamName, slug, mhaTeamIds: [ref.mhaTeamId] },
    })
    teamCache.set(ref.mhaTeamId, String(created.id))
    return String(created.id)
  }

  const resolveCompetitionType = async (name: string): Promise<string> => {
    const cached = competitionTypeCache.get(name)
    if (cached) return cached

    const { docs } = await payload.find({
      collection: 'competitionTypes',
      where: { competitionTypeName: { equals: name } },
      limit: 1,
      depth: 0,
    })
    const id = docs[0]
      ? String(docs[0].id)
      : dryRun
        ? `new-type:${name}`
        : String(
            (await payload.create({ collection: 'competitionTypes', data: { competitionTypeName: name } })).id,
          )
    competitionTypeCache.set(name, id)
    return id
  }

  const resolveCompetition = async (c: MappedFixture['competition']): Promise<string> => {
    const key = `${c.competitionName}|${c.season}`
    const cached = competitionCache.get(key)
    if (cached) return cached

    const { docs } = await payload.find({
      collection: 'competitions',
      where: {
        and: [{ competitionName: { equals: c.competitionName } }, { season: { equals: c.season } }],
      },
      limit: 1,
      depth: 0,
    })

    let id: string
    if (docs[0]) {
      id = String(docs[0].id)
    } else {
      result.competitionsCreated.push(`${c.competitionName} (${c.season})`)
      const competitionType = await resolveCompetitionType(c.competitionTypeName)
      id = dryRun
        ? `new-competition:${key}`
        : String(
            (
              await payload.create({
                collection: 'competitions',
                data: { competitionName: c.competitionName, season: c.season, competitionType },
              })
            ).id,
          )
    }
    competitionCache.set(key, id)
    return id
  }

  for (const mha of ours) {
    const label = `${mha.homeTeam || 'TBC'} v ${mha.awayTeam || 'TBC'} (${mha.date})`
    const push = (action: SyncAction, detail?: string) => {
      result.counts[action]++
      result.items.push({ fixtureCode: mha.matchId, label, action, detail })
    }

    const mapped = mapMhaFixture(mha)
    if (!mapped.ok) {
      push('skipped', mapped.reason)
      continue
    }

    const { fixture } = mapped
    const detail = fixture.warnings.length ? fixture.warnings.join('; ') : undefined

    try {
      // Sequential on purpose: both sides can link to the same team document and
      // concurrent updates to its `mhaTeamIds` would drop one of the ids.
      const homeTeam = await resolveTeam(fixture.home)
      const awayTeam = await resolveTeam(fixture.away)
      const competition = await resolveCompetition(fixture.competition)

      const data = {
        fixtureCode: fixture.fixtureCode,
        homeTeam,
        awayTeam,
        homeScore: fixture.homeScore,
        awayScore: fixture.awayScore,
        startDate: fixture.startDate,
        venue: fixture.venue,
        status: fixture.status,
        competition,
      }

      const { docs } = await payload.find({
        collection: 'fixtures',
        where: { fixtureCode: { equals: fixture.fixtureCode } },
        limit: 1,
        depth: 0,
      })
      const existing = docs[0]

      const queueLineup = (fixtureId: string | null) => {
        if (data.status !== 'Finished') return
        const hasLineup = Boolean(existing?.homeLineup?.length || existing?.awayLineup?.length)
        if (hasLineup && !refreshLineups) return
        lineupJobs.push({
          fixtureId,
          matchId: fixture.fixtureCode,
          label,
          homeTeam,
          awayTeam,
          homeIsOurs: mha.homeClub === MHA_CLUB_NAME,
          awayIsOurs: mha.awayClub === MHA_CLUB_NAME,
          existing: existing ?? null,
        })
      }

      if (!existing) {
        const created = dryRun ? null : await payload.create({ collection: 'fixtures', data })
        push('created', detail)
        queueLineup(created ? String(created.id) : null)
        continue
      }

      queueLineup(String(existing.id))

      const changed =
        idOf(existing.homeTeam) !== homeTeam ||
        idOf(existing.awayTeam) !== awayTeam ||
        idOf(existing.competition) !== competition ||
        (existing.homeScore ?? 0) !== data.homeScore ||
        (existing.awayScore ?? 0) !== data.awayScore ||
        new Date(existing.startDate).getTime() !== new Date(data.startDate).getTime() ||
        existing.venue !== data.venue ||
        existing.status !== data.status

      if (!changed) {
        push('unchanged')
        continue
      }

      if (!dryRun) await payload.update({ collection: 'fixtures', id: existing.id, data })
      push('updated', detail)
    } catch (err) {
      payload.logger.error({ msg: `MHA sync failed for ${mha.matchId}`, err })
      push('error', err instanceof Error ? err.message : String(err))
    }
  }

  await syncLineups(payload, lineupJobs, result, dryRun)
  await syncPlayerStats(payload, result, dryRun)

  return result
}

const errorMessage = (err: unknown) => (err instanceof Error ? err.message : String(err))

/** Runs `fn` over `items` with at most `limit` in flight, keeping input order. */
const mapLimit = async <T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> => {
  const out = new Array<R>(items.length)
  let next = 0
  const worker = async () => {
    while (next < items.length) {
      const i = next++
      out[i] = await fn(items[i])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return out
}

/** The stored fields of a line-up row, without Payload's row `id`, for change detection. */
const comparableRows = (rows: unknown): string =>
  JSON.stringify(
    (Array.isArray(rows) ? rows : []).map((r: Record<string, unknown>) => ({
      mhaPlayerId: r.mhaPlayerId ?? '',
      name: r.name ?? '',
      number: r.number ?? null,
      player: idOf(r.player),
      goals: r.goals ?? 0,
      penaltyGoals: r.penaltyGoals ?? 0,
      penaltyAttempts: r.penaltyAttempts ?? 0,
      yellowCard: r.yellowCard || null,
      suspensions: Array.isArray(r.suspensions) ? r.suspensions : [],
      redCard: r.redCard || null,
      mvp: r.mvp === true,
    })),
  )

/**
 * Reads the match report of each queued fixture and stores both line-ups. La Salle
 * rows are linked to `players` docs — by `mhaPlayerId`, else by an unambiguous
 * name match on an unlinked player, else a new player on that fixture's team.
 */
const syncLineups = async (payload: Payload, jobs: LineupJob[], result: SyncResult, dryRun: boolean) => {
  if (!jobs.length) return

  // Reports are fetched in parallel; everything that writes runs in order afterwards
  // so a player appearing in two reports is only created once.
  const reports = await mapLimit(jobs, MHA_CONCURRENCY, async (job) => {
    try {
      return { job, report: await fetchMhaMatchReport(job.matchId) }
    } catch (err) {
      return { job, error: errorMessage(err) }
    }
  })

  const { docs: players } = await payload.find({
    collection: 'players',
    pagination: false,
    depth: 0,
    select: { firstName: true, lastName: true, mhaPlayerId: true },
  })
  const byMhaId = new Map<string, string>()
  const unlinkedByName = new Map<string, string[]>()
  for (const p of players) {
    if (p.mhaPlayerId) {
      byMhaId.set(p.mhaPlayerId, String(p.id))
    } else {
      const key = nameKey(`${p.firstName} ${p.lastName}`)
      unlinkedByName.set(key, [...(unlinkedByName.get(key) ?? []), String(p.id)])
    }
  }

  const resolvePlayer = async (row: MappedLineupRow, teamId: string): Promise<string | null> => {
    if (!row.mhaPlayerId) return null
    const known = byMhaId.get(row.mhaPlayerId)
    if (known) return known

    const sameName = unlinkedByName.get(nameKey(row.name)) ?? []
    if (sameName.length > 1) {
      result.warnings.push(`${row.name} (${row.mhaPlayerId}) matches ${sameName.length} players by name; left unlinked`)
      return null
    }

    let id: string
    if (sameName.length === 1) {
      id = sameName[0]
      if (!dryRun) await payload.update({ collection: 'players', id, data: { mhaPlayerId: row.mhaPlayerId } })
      unlinkedByName.delete(nameKey(row.name))
      result.playersLinked.push(`${row.mhaPlayerId} → ${row.name}`)
    } else {
      result.playersCreated.push(`${row.name} (${row.mhaPlayerId})`)
      id = dryRun
        ? `new-player:${row.mhaPlayerId}`
        : String(
            (
              await payload.create({
                collection: 'players',
                data: {
                  ...splitName(row.name),
                  number: row.number,
                  team: teamId,
                  mhaPlayerId: row.mhaPlayerId,
                },
              })
            ).id,
          )
    }
    byMhaId.set(row.mhaPlayerId, id)
    return id
  }

  const buildRows = async (
    players: MhaMatchReport['homePlayers'],
    isOurs: boolean,
    teamId: string,
  ): Promise<LineupRow[]> => {
    const rows: LineupRow[] = []
    for (const row of mapLineup(players)) {
      rows.push({ ...row, player: isOurs ? await resolvePlayer(row, teamId) : null })
    }
    return rows
  }

  for (const { job, report, error } of reports) {
    if (error) {
      result.lineups.failed++
      result.warnings.push(`${job.label}: match report failed — ${error}`)
      continue
    }
    if (!report) {
      result.lineups.pending++
      continue
    }

    try {
      const homeLineup = await buildRows(report.homePlayers, job.homeIsOurs, job.homeTeam)
      const awayLineup = await buildRows(report.awayPlayers, job.awayIsOurs, job.awayTeam)

      const unchanged =
        job.existing &&
        comparableRows(job.existing.homeLineup) === comparableRows(homeLineup) &&
        comparableRows(job.existing.awayLineup) === comparableRows(awayLineup)
      if (unchanged) {
        result.lineups.unchanged++
        continue
      }

      if (!dryRun && job.fixtureId) {
        await payload.update({ collection: 'fixtures', id: job.fixtureId, data: { homeLineup, awayLineup } })
      }
      result.lineups.saved++
    } catch (err) {
      payload.logger.error({ msg: `MHA line-up sync failed for ${job.matchId}`, err })
      result.lineups.failed++
      result.warnings.push(`${job.label}: ${errorMessage(err)}`)
    }
  }
}

const STAT_FIELDS = [
  'appearances',
  'goals',
  'penaltyGoals',
  'yellowCards',
  'suspensions',
  'redCards',
  'blueCards',
  'mvp',
] as const

/**
 * Refreshes `seasonStats` on every player linked to MHA with their totals for the
 * active MHA season. These cover all competitions, including any we don't sync.
 */
const syncPlayerStats = async (payload: Payload, result: SyncResult, dryRun: boolean) => {
  let season: Awaited<ReturnType<typeof fetchMhaActiveSeason>>
  try {
    season = await fetchMhaActiveSeason()
  } catch (err) {
    result.warnings.push(`Player stats skipped: ${errorMessage(err)}`)
    return
  }
  if (!season) {
    result.warnings.push('Player stats skipped: MHA has no active season')
    return
  }
  result.playerStats.season = season.seasonName

  const { docs: players } = await payload.find({
    collection: 'players',
    where: { mhaPlayerId: { exists: true } },
    pagination: false,
    depth: 0,
    select: { firstName: true, lastName: true, mhaPlayerId: true, seasonStats: true },
  })

  const fetched = await mapLimit(players, MHA_CONCURRENCY, async (player) => {
    try {
      return { player, stats: await fetchMhaPlayerStats(player.mhaPlayerId!, season.seasonId) }
    } catch (err) {
      return { player, error: errorMessage(err) }
    }
  })

  for (const { player, stats, error } of fetched) {
    const name = `${player.firstName} ${player.lastName}`
    if (error || !stats) {
      result.playerStats.failed++
      result.warnings.push(`${name}: season stats failed — ${error}`)
      continue
    }

    const current = player.seasonStats ?? {}
    const next = Object.fromEntries(STAT_FIELDS.map((f) => [f, Number(stats.totals[f] ?? 0) || 0]))
    const changed =
      current.season !== season.seasonName || STAT_FIELDS.some((f) => (current[f] ?? null) !== next[f])
    if (!changed) {
      result.playerStats.unchanged++
      continue
    }

    try {
      if (!dryRun) {
        await payload.update({
          collection: 'players',
          id: player.id,
          data: { seasonStats: { season: season.seasonName, ...next, syncedAt: new Date().toISOString() } },
        })
      }
      result.playerStats.updated++
    } catch (err) {
      result.playerStats.failed++
      result.warnings.push(`${name}: ${errorMessage(err)}`)
    }
  }
}

/** Team slugs are unique; a second team that slugifies the same way gets a numeric suffix. */
const uniqueTeamSlug = async (payload: Payload, teamName: string): Promise<string> => {
  const base = slugify(teamName) || 'team'
  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`
    const { totalDocs } = await payload.count({ collection: 'teams', where: { slug: { equals: candidate } } })
    if (totalDocs === 0) return candidate
  }
  return `${base}-${Date.now()}`
}
