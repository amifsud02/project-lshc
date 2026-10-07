import type { Payload } from 'payload'

import { slugify } from '@/lib/utils/fixtureSlug'

import { fetchMhaFixtures, type MhaFixture } from './client'
import { mapMhaFixture, type MappedFixture, type MhaTeamRef } from './mapFixture'

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
}

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
 *
 * With `dryRun` nothing is written; the result reports what would happen.
 */
export const syncMhaFixtures = async (
  payload: Payload,
  { dryRun = false }: { dryRun?: boolean } = {},
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
  }

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
      push('error', err instanceof Error ? err.message : String(err))
    }
  }

  return result
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
