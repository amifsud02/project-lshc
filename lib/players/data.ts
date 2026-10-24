import type { Fixture, Player } from '@/payload-types'
import { cachedFind } from '@/lib/utils/payload/cached'
import { fixtureFromPayload, type NormalizedFixture } from '@/lib/utils/normalize/sports'

/** A player whose profile page is switched on; anyone else has no public page. */
export async function getPlayerProfile(slug: string): Promise<Player | null> {
  const { docs } = await cachedFind({
    collection: 'players',
    where: { and: [{ slug: { equals: slug } }, { profilePage: { equals: true } }] },
    depth: 1,
    limit: 1,
  })
  return (docs[0] as Player) ?? null
}

export type PlayerMatch = {
  fixture: NormalizedFixture
  goals: number
  mvp: boolean
}

const relId = (value: unknown): string | null => {
  const id = value && typeof value === 'object' ? (value as { id?: unknown }).id : value
  return id == null ? null : String(id)
}

/** The player's most recent finished matches, from the line-ups the fixtures sync stores. */
export async function getPlayerMatches(playerId: string, limit = 10): Promise<PlayerMatch[]> {
  const { docs } = await cachedFind({
    collection: 'fixtures',
    where: {
      and: [
        { status: { equals: 'Finished' } },
        { or: [{ 'homeLineup.player': { equals: playerId } }, { 'awayLineup.player': { equals: playerId } }] },
      ],
    },
    depth: 1,
    limit,
    sort: '-startDate',
  })

  return (docs as Fixture[]).map((doc) => {
    const row = [...(doc.homeLineup ?? []), ...(doc.awayLineup ?? [])].find((r) => relId(r.player) === playerId)
    return { fixture: fixtureFromPayload(doc), goals: row?.goals ?? 0, mvp: row?.mvp === true }
  })
}
