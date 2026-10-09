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
import {
  emptySyncResult,
  mergeSyncResults,
  SYNC_STAGES,
  type SyncAction,
  type SyncResult,
  type SyncStage,
} from './syncResult'

export type { SyncAction, SyncItem, SyncResult, SyncStage } from './syncResult'

/** The club whose fixtures are pulled in, as named in the feed's `homeClub` / `awayClub`. */
export const MHA_CLUB_NAME = 'La Salle'

export type SyncOptions = {
  dryRun?: boolean
  /**
   * Re-read the match report of every finished fixture, not only those without a
   * line-up yet. For when MHA corrects a score sheet after the fact.
   */
  refreshLineups?: boolean
  stage?: SyncStage
  /** Position in the stage's list to start from, as returned in `nextOffset`. */
  offset?: number
  /**
   * Epoch ms after which no new item is started; the result's `nextOffset` says
   * where to carry on. Keeps each request inside a serverless time limit.
   */
  deadline?: number
}

type StageContext = {
  payload: Payload
  dryRun: boolean
  refreshLineups: boolean
  offset: number
  /** True once the deadline has passed. Always false for the first item, so every request makes progress. */
  outOfTime: (index: number) => boolean
  result: SyncResult
}

type Id = string | number

const idOf = (value: unknown): string | null => {
  if (value == null) return null
  if (typeof value === 'object') return idOf((value as { id?: Id }).id)
  return String(value)
}

const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase())

const errorMessage = (err: unknown) => (err instanceof Error ? err.message : String(err))

/** MHA's server is a small WordPress install; keep parallel requests modest. */
const MHA_CONCURRENCY = 4

/**
 * Runs one stage of the MHA sync from `offset`, stopping at `deadline`.
 *
 * - **fixtures** — upserts every La Salle fixture on `fixtureCode` (the MHA match
 *   id), so re-running only writes what changed. Fixtures that disappear from the
 *   feed are left alone. Teams are linked through their `mhaTeamIds`; a team seen
 *   for the first time is matched by name — a club's first team ("…-001") against
 *   the club's full name, so it lands on the existing "La Salle Handball Club"
 *   rather than this season's sponsor name — and only created when nothing
 *   matches. Competitions are matched on name + season and created as needed.
 * - **lineups** — stores both line-ups of each finished fixture, with every
 *   player's goals, 7m, cards and suspensions, from the MHA match report. Reports
 *   are only read for fixtures without a line-up yet (all of them with
 *   `refreshLineups`). La Salle players are linked through `mhaPlayerId` —
 *   matched by name the first time, created when nothing matches.
 * - **stats** — refreshes the season totals of every player linked to MHA.
 *
 * With `dryRun` nothing is written; the result reports what would happen.
 */
export const runMhaSyncStage = async (
  payload: Payload,
  { dryRun = false, refreshLineups = false, stage = 'fixtures', offset = 0, deadline }: SyncOptions = {},
): Promise<SyncResult> => {
  const ctx: StageContext = {
    payload,
    dryRun,
    refreshLineups,
    offset,
    outOfTime: (index) => index > offset && deadline != null && Date.now() > deadline,
    result: emptySyncResult(dryRun, stage, offset),
  }

  if (stage === 'fixtures') await syncFixtures(ctx)
  else if (stage === 'lineups') await syncLineups(ctx)
  else await syncPlayerStats(ctx)

  return ctx.result
}

/** Runs every stage to the end in one go — for scripts, where there is no time limit. */
export const syncMhaFixtures = async (
  payload: Payload,
  options: Omit<SyncOptions, 'stage' | 'offset' | 'deadline'> = {},
): Promise<SyncResult> => {
  let merged = emptySyncResult(options.dryRun ?? false)
  for (const stage of SYNC_STAGES) {
    let offset: number | null = 0
    while (offset !== null) {
      const result = await runMhaSyncStage(payload, { ...options, stage, offset })
      merged = mergeSyncResults(merged, result)
      offset = result.nextOffset
    }
  }
  return merged
}

/** La Salle's fixtures on the feed, in a stable order so offsets mean the same thing across requests. */
const ourFixtures = (fixtures: MhaFixture[]) =>
  fixtures
    .filter((f) => f.homeClub === MHA_CLUB_NAME || f.awayClub === MHA_CLUB_NAME)
    .sort((a, b) => a.matchId.localeCompare(b.matchId))

/** MHA team id → our team id, for every team already linked. One query instead of one per fixture. */
const loadLinkedTeams = async (payload: Payload): Promise<Map<string, string>> => {
  const { docs } = await payload.find({
    collection: 'teams',
    where: { mhaTeamIds: { exists: true } },
    pagination: false,
    depth: 0,
    select: { mhaTeamIds: true },
  })
  const map = new Map<string, string>()
  for (const team of docs) for (const mhaId of team.mhaTeamIds ?? []) map.set(mhaId, String(team.id))
  return map
}

const syncFixtures = async ({ payload, dryRun, offset, outOfTime, result }: StageContext) => {
  const feed = await fetchMhaFixtures()
  const ours = ourFixtures(feed.fixtures)

  result.fetched = feed.fixtures.length
  result.considered = ours.length
  result.total = ours.length

  // "la salle handball club" → "La Salle", inverted so a short club name finds its full name.
  const clubFullNames = new Map(
    Object.entries(feed.clubAliases).map(([full, short]) => [short.toLowerCase(), titleCase(full)]),
  )

  const teamCache = await loadLinkedTeams(payload)
  const competitionCache = new Map<string, string>()
  const competitionTypeCache = new Map<string, string>()

  const { docs: existingDocs } = await payload.find({
    collection: 'fixtures',
    where: { fixtureCode: { in: ours.map((f) => f.matchId) } },
    pagination: false,
    depth: 0,
    select: {
      fixtureCode: true,
      homeTeam: true,
      awayTeam: true,
      competition: true,
      homeScore: true,
      awayScore: true,
      startDate: true,
      venue: true,
      status: true,
    },
  })
  const existingByCode = new Map(existingDocs.map((f) => [f.fixtureCode, f]))

  const resolveTeam = async (ref: MhaTeamRef): Promise<string> => {
    const cached = teamCache.get(ref.mhaTeamId)
    if (cached) return cached

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

  for (let i = offset; i < ours.length; i++) {
    if (outOfTime(i)) {
      result.nextOffset = i
      return
    }

    const mha = ours[i]
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

      const existing = existingByCode.get(fixture.fixtureCode)

      if (!existing) {
        if (!dryRun) await payload.create({ collection: 'fixtures', data })
        push('created', detail)
        continue
      }

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
      push('error', errorMessage(err))
    }
  }
}

type LineupRow = MappedLineupRow & { player: string | null }

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

const syncLineups = async ({ payload, dryRun, refreshLineups, offset, outOfTime, result }: StageContext) => {
  const feed = await fetchMhaFixtures()
  const finished = ourFixtures(feed.fixtures).filter((f) => {
    const mapped = mapMhaFixture(f)
    return mapped.ok && mapped.fixture.status === 'Finished'
  })
  result.total = finished.length
  if (!finished.length) return

  const { docs: fixtureDocs } = await payload.find({
    collection: 'fixtures',
    where: { fixtureCode: { in: finished.map((f) => f.matchId) } },
    pagination: false,
    depth: 0,
    select: { fixtureCode: true, homeTeam: true, awayTeam: true, homeLineup: true, awayLineup: true },
  })
  const fixtureByCode = new Map(fixtureDocs.map((f) => [f.fixtureCode, f]))
  const linkedTeams = await loadLinkedTeams(payload)

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

  // Players are resolved one row at a time so a player appearing in two reports is only created once.
  const buildRows = async (
    sheet: MhaMatchReport['homePlayers'],
    isOurs: boolean,
    teamId: string,
  ): Promise<LineupRow[]> => {
    const rows: LineupRow[] = []
    for (const row of mapLineup(sheet)) {
      rows.push({ ...row, player: isOurs ? await resolvePlayer(row, teamId) : null })
    }
    return rows
  }

  const teamFor = (mhaTeamId: string, stored: unknown) =>
    idOf(stored) ?? linkedTeams.get(mhaTeamId) ?? `new-team:${mhaTeamId}`

  let i = offset
  while (i < finished.length) {
    if (outOfTime(i)) {
      result.nextOffset = i
      return
    }

    // Fixtures that already have a line-up are passed over without a request, so a
    // batch is the next few that actually need their report read.
    const batch: MhaFixture[] = []
    while (i < finished.length && batch.length < MHA_CONCURRENCY) {
      const mha = finished[i++]
      const doc = fixtureByCode.get(mha.matchId)
      const hasLineup = Boolean(doc?.homeLineup?.length || doc?.awayLineup?.length)
      if (!hasLineup || refreshLineups) batch.push(mha)
    }

    const reports = await Promise.all(
      batch.map(async (mha) => {
        try {
          return { mha, report: await fetchMhaMatchReport(mha.matchId) }
        } catch (err) {
          return { mha, error: errorMessage(err) }
        }
      }),
    )

    for (const { mha, report, error } of reports) {
      const label = `${mha.homeTeam} v ${mha.awayTeam} (${mha.date})`
      if (error) {
        result.lineups.failed++
        result.warnings.push(`${label}: match report failed — ${error}`)
        continue
      }
      if (!report) {
        result.lineups.pending++
        continue
      }

      const doc = fixtureByCode.get(mha.matchId)
      try {
        const homeLineup = await buildRows(
          report.homePlayers,
          mha.homeClub === MHA_CLUB_NAME,
          teamFor(mha.homeTeamId, doc?.homeTeam),
        )
        const awayLineup = await buildRows(
          report.awayPlayers,
          mha.awayClub === MHA_CLUB_NAME,
          teamFor(mha.awayTeamId, doc?.awayTeam),
        )

        if (
          doc &&
          comparableRows(doc.homeLineup) === comparableRows(homeLineup) &&
          comparableRows(doc.awayLineup) === comparableRows(awayLineup)
        ) {
          result.lineups.unchanged++
          continue
        }

        // A fixture only a dry run would create has nothing to write to yet.
        if (!dryRun && doc) {
          await payload.update({ collection: 'fixtures', id: doc.id, data: { homeLineup, awayLineup } })
        }
        result.lineups.saved++
      } catch (err) {
        payload.logger.error({ msg: `MHA line-up sync failed for ${mha.matchId}`, err })
        result.lineups.failed++
        result.warnings.push(`${label}: ${errorMessage(err)}`)
      }
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
const syncPlayerStats = async ({ payload, dryRun, offset, outOfTime, result }: StageContext) => {
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
    sort: 'mhaPlayerId',
    select: { firstName: true, lastName: true, mhaPlayerId: true, seasonStats: true },
  })
  result.total = players.length

  for (let i = offset; i < players.length; i += MHA_CONCURRENCY) {
    if (outOfTime(i)) {
      result.nextOffset = i
      return
    }

    const fetched = await Promise.all(
      players.slice(i, i + MHA_CONCURRENCY).map(async (player) => {
        try {
          return { player, stats: await fetchMhaPlayerStats(player.mhaPlayerId!, season.seasonId) }
        } catch (err) {
          return { player, error: errorMessage(err) }
        }
      }),
    )

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
