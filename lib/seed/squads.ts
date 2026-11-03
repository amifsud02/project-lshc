import type { Payload } from 'payload'
import { categoryFromCompetitionName } from '@/lib/fixtures/categories'
import type { Squad } from '@/lib/players/squads'

type Position = 'Goalkeeper' | 'LinePlayer' | 'Winger' | 'PlayMaker' | 'Lateral' | 'Coach'

/**
 * Positions (and under-21 squads) from the squad lists that used to be written into the team
 * pages, for the players who are also in Payload. Where the old lists disagreed, the first-team
 * position wins.
 */
const FROM_OLD_LISTS: { name: string; position: Position; u21?: Squad }[] = [
  { name: 'Raffaella Zammit Tabona', position: 'Goalkeeper' },
  { name: 'Jessica Agius', position: 'Winger' },
  { name: 'Beti Petkovska', position: 'LinePlayer' },
  { name: 'Kirsty Collins', position: 'PlayMaker', u21: 'u21-womens-team' },
  { name: 'Matthew Fenech', position: 'Goalkeeper', u21: 'u21-mens-team' },
  { name: 'Liam Apap', position: 'Winger', u21: 'u21-mens-team' },
  { name: 'Miguel Gruppetta', position: 'Winger' },
  { name: 'Jeremy John Scicluna', position: 'Winger' },
  { name: 'Julian Seguna', position: 'LinePlayer' },
  { name: 'Neil Gruppetta', position: 'PlayMaker', u21: 'u21-mens-team' },
  { name: 'Anthony Mifsud', position: 'LinePlayer', u21: 'u21-mens-team' },
  { name: 'Ben Galea', position: 'Winger' },
  { name: 'Liam Borg', position: 'LinePlayer' },
  { name: 'Jordi Stafrace', position: 'Winger' },
  { name: 'Stephanie Caruana', position: 'PlayMaker' },
  { name: 'Shanice Ahar', position: 'Winger' },
  { name: 'Kristina Falzon', position: 'PlayMaker' },
  // Spelt differently on the MHA feed than on the old lists.
  { name: 'Alan Portelli', position: 'Winger' },
  { name: 'Chris Magro', position: 'Lateral' },
  { name: 'Oueslati Khalifa', position: 'Lateral' },
  { name: 'Cassandra Nicole Petrella', position: 'Lateral' },
  { name: 'Desislava Krasteva', position: 'Winger' },
  { name: 'Amy marie Vella', position: 'Goalkeeper', u21: 'u21-womens-team' },
]

const norm = (s: string) =>
  s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '')

const id = (ref: unknown) => String(typeof ref === 'object' && ref ? (ref as { id: string }).id : ref)

export type SquadSeedResult = { name: string; squads: string[]; position?: string }

/**
 * Adds squads and positions; never removes a squad or replaces a position someone has set.
 * A La Salle player goes on the men's or women's page if they played for a La Salle senior side
 * this season (from the fixtures' line-ups), and on an under-21 page if the old lists had them
 * there. Players of other clubs only get their position.
 */
export async function seedSquads(payload: Payload, { dryRun = false } = {}): Promise<SquadSeedResult[]> {
  const { docs: teams } = await payload.find({ collection: 'teams', limit: 200, depth: 0, pagination: false })
  const laSalle = new Set(teams.filter((t) => String(t.slug ?? '').startsWith('la-salle')).map((t) => String(t.id)))

  const { docs: fixtures } = await payload.find({
    collection: 'fixtures',
    where: { or: [{ 'homeLineup.player': { exists: true } }, { 'awayLineup.player': { exists: true } }] },
    depth: 1,
    limit: 1000,
    pagination: false,
  })
  const fromLineups = new Map<string, Set<Squad>>()
  for (const f of fixtures as any[]) {
    const category = f.competition?.category ?? categoryFromCompetitionName(f.competition?.name ?? '')
    const squad: Squad | undefined =
      category === 'men' ? 'men-first-team' : category === 'women' ? 'women-first-team' : undefined
    if (!squad) continue
    for (const [lineup, team] of [
      [f.homeLineup, f.homeTeam],
      [f.awayLineup, f.awayTeam],
    ]) {
      if (!laSalle.has(id(team))) continue
      for (const row of lineup ?? []) {
        if (!row?.player) continue
        const key = id(row.player)
        fromLineups.set(key, (fromLineups.get(key) ?? new Set()).add(squad))
      }
    }
  }

  const oldLists = new Map(FROM_OLD_LISTS.map((p) => [norm(p.name), p]))
  const { docs: players } = await payload.find({ collection: 'players', limit: 1000, depth: 0, pagination: false })
  const results: SquadSeedResult[] = []

  for (const player of players as any[]) {
    const isLaSalle = [player.team, ...(player.otherTeams ?? [])].some((t: unknown) => laSalle.has(id(t)))
    const old = oldLists.get(norm(`${player.firstName} ${player.lastName}`))
    const squads = new Set<string>(player.squads ?? [])
    if (isLaSalle) {
      for (const s of fromLineups.get(String(player.id)) ?? []) squads.add(s)
      if (old?.u21) squads.add(old.u21)
    }
    const position = player.position || old?.position
    const changed = squads.size !== (player.squads ?? []).length || position !== player.position
    if (!changed) continue
    if (!dryRun) await payload.update({
      collection: 'players',
      id: player.id,
      data: { squads: [...squads], ...(position ? { position } : {}) } as any,
    })
    results.push({ name: `${player.firstName} ${player.lastName}`, squads: [...squads], position })
  }
  return results
}
