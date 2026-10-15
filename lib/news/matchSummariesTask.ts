import type { TaskConfig } from 'payload'

import { createMatchSummaryPosts } from './matchSummaries'

/** Queue the match-summaries job runs on; `jobs.autoRun` in payload.config.ts watches it. */
export const MATCH_SUMMARIES_QUEUE = 'match-summaries'

/**
 * Nightly job that writes a draft news post for each La Salle match that finished
 * in the last week (see matchSummaries.ts). Payload queues it at 21:00 server time
 * (UTC on Railway, i.e. 22:00/23:00 in Malta) and never more than one at a time;
 * already-posted matches are skipped, so a re-run is harmless.
 */
export const matchSummariesTask: TaskConfig<{
  input: Record<string, never>
  output: { created: number; skipped: number; errors: number; remaining: number }
}> = {
  slug: 'matchSummaries',
  label: 'Write match summaries',
  schedule: [{ cron: '0 0 21 * * *', queue: MATCH_SUMMARIES_QUEUE }],
  retries: 1,
  outputSchema: [
    { name: 'created', type: 'number' },
    { name: 'skipped', type: 'number' },
    { name: 'errors', type: 'number' },
    { name: 'remaining', type: 'number' },
  ],
  handler: async ({ req }) => {
    const result = await createMatchSummaryPosts(req.payload)
    const count = (action: string) => result.items.filter((i) => i.action === action).length
    req.payload.logger.info({ msg: 'Match summaries written', items: result.items })
    return {
      output: {
        created: count('created'),
        skipped: count('skipped'),
        errors: count('error'),
        remaining: result.remaining,
      },
    }
  },
}
