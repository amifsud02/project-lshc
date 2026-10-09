import type { MhaReportPlayer } from './client'

/**
 * Pure translation of a match report's team sheet into the rows stored on a
 * fixture's `homeLineup` / `awayLineup`. The `player` relationship is filled in
 * by `syncMhaFixtures`, and only for La Salle's side — opponents are kept by name.
 */

export type MappedLineupRow = {
  mhaPlayerId: string
  name: string
  number: number | null
  goals: number
  penaltyGoals: number
  penaltyAttempts: number
  yellowCard: string | null
  suspensions: string[]
  redCard: string | null
  mvp: boolean
}

const clock = (value: string): string | null => {
  const trimmed = String(value ?? '').trim()
  return trimmed && trimmed !== '–' && trimmed !== '-' ? trimmed : null
}

const count = (value: unknown): number => Number(value ?? 0) || 0

export const mapLineup = (players: MhaReportPlayer[]): MappedLineupRow[] =>
  players
    .filter((p) => String(p.name ?? '').trim())
    .map((p) => {
      const kit = Number.parseInt(String(p.kit ?? ''), 10)
      return {
        mhaPlayerId: String(p.mhaId ?? '').trim(),
        name: String(p.name).trim(),
        number: Number.isFinite(kit) ? kit : null,
        goals: count(p.goals),
        penaltyGoals: count(p.penaltyScored),
        penaltyAttempts: count(p.penaltyGiven),
        yellowCard: clock(p.yellowTime),
        suspensions: [p.twoMin1, p.twoMin2, p.twoMin3].map(clock).filter((t): t is string => t !== null),
        redCard: clock(p.redTime),
        mvp: p.isMvp === true,
      }
    })
    .sort((a, b) => (a.number ?? 999) - (b.number ?? 999))

/**
 * "Cassandra Nicole Petrella" → first "Cassandra Nicole", last "Petrella". MHA
 * sends one name string, so the last word is taken as the surname — editors can
 * correct a compound surname in the admin and the link on `mhaPlayerId` holds.
 */
export const splitName = (fullName: string): { firstName: string; lastName: string } => {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] }
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts[parts.length - 1] }
}

/** Case-, accent- and whitespace-insensitive key for matching names entered by hand. */
export const nameKey = (name: string): string =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]+/g, ' ')
    .trim()
