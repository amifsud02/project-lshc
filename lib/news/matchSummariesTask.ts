import type { TaskConfig } from 'payload'

import { createMatchSummaryPosts } from './matchSummaries'

/** Queue the match-summaries job runs on; `jobs.autoRun` in payload.config.ts watches it. */
export const MATCH_SUMMARIES_QUEUE = 'match-summaries'

/**
 * Nightly job that writes a draft weekly round-up of La Salle's matches once the week
 * is complete (see matchSummaries.ts). Payload queues it at 21:00 server time (UTC on
 * Railway, i.e. 22:00/23:00 in Malta), so a weekend's round-up is usually ready on
 * Sunday night, and never runs more than one at a time; matches already covered are
 * skipped, so a re-run is harmless.
 */
export const matchSummariesTask: TaskConfig<{
  input: Record<string, never>
  output: { created: number; waiting: number; errors: number; remaining: number }
}> = {
  slug: 'matchSummaries',
  label: 'Write match round-ups',
  schedule: [{ cron: '0 0 21 * * *', queue: MATCH_SUMMARIES_QUEUE }],
  retries: 1,
  outputSchema: [
    { name: 'created', type: 'number' },
    { name: 'waiting', type: 'number' },
    { name: 'errors', type: 'number' },
    { name: 'remaining', type: 'number' },
  ],
  handler: async ({ req }) => {
    const result = await createMatchSummaryPosts(req.payload)
    const count = (action: string) => result.roundUps.filter((r) => r.action === action).length
    req.payload.logger.info({ msg: 'Match round-ups written', roundUps: result.roundUps })
    return {
      output: {
        created: count('created'),
        waiting: count('waiting'),
        errors: count('error'),
        remaining: result.remaining,
      },
    }
  },
}
