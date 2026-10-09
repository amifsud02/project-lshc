/**
 * Result shape of an MHA sync, shared by the server and the admin panel. Kept free
 * of server imports so the client component can merge results without bundling
 * Payload.
 */

/**
 * A sync runs in three stages, each over a list that can take several requests:
 * fixtures and results, then line-ups of finished matches, then player season stats.
 */
export type SyncStage = 'fixtures' | 'lineups' | 'stats'

export const SYNC_STAGES: SyncStage[] = ['fixtures', 'lineups', 'stats']

export type SyncAction = 'created' | 'updated' | 'unchanged' | 'skipped' | 'error'

export type SyncItem = {
  fixtureCode: string
  label: string
  action: SyncAction
  detail?: string
}

export type SyncResult = {
  dryRun: boolean
  stage: SyncStage
  /** Position in the stage's list this request started from. */
  offset: number
  /** Length of the stage's list. */
  total: number
  /** Where the next request should carry on, or null once the stage is done. */
  nextOffset: number | null
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

export const emptySyncResult = (dryRun: boolean, stage: SyncStage = 'fixtures', offset = 0): SyncResult => ({
  dryRun,
  stage,
  offset,
  total: 0,
  nextOffset: null,
  fetched: 0,
  considered: 0,
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
})

const sum = <K extends string>(a: Record<K, number>, b: Record<K, number>): Record<K, number> =>
  Object.fromEntries(Object.keys(a).map((k) => [k, a[k as K] + (b[k as K] ?? 0)])) as Record<K, number>

// A dry run has nothing saved to remember between requests, so the same new team
// or player can be reported by more than one of them.
const union = (a: string[], b: string[]) => [...new Set([...a, ...b])]

/** Folds the result of the next request into the running total of a multi-request sync. */
export const mergeSyncResults = (a: SyncResult, b: SyncResult): SyncResult => ({
  ...b,
  fetched: a.fetched || b.fetched,
  considered: a.considered || b.considered,
  counts: sum(a.counts, b.counts),
  teamsCreated: union(a.teamsCreated, b.teamsCreated),
  teamsLinked: union(a.teamsLinked, b.teamsLinked),
  competitionsCreated: union(a.competitionsCreated, b.competitionsCreated),
  items: [...a.items, ...b.items],
  lineups: sum(a.lineups, b.lineups),
  playersCreated: union(a.playersCreated, b.playersCreated),
  playersLinked: union(a.playersLinked, b.playersLinked),
  playerStats: {
    ...sum(
      { updated: a.playerStats.updated, unchanged: a.playerStats.unchanged, failed: a.playerStats.failed },
      { updated: b.playerStats.updated, unchanged: b.playerStats.unchanged, failed: b.playerStats.failed },
    ),
    season: b.playerStats.season ?? a.playerStats.season,
  },
  warnings: union(a.warnings, b.warnings),
})
