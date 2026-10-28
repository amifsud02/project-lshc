import type { TaskConfig } from 'payload'

import { scheduleResultChecks } from './resultCheck'

/** Queue the result-check scheduler runs on; `jobs.autoRun` in payload.config.ts watches it. */
export const RESULT_CHECKS_QUEUE = 'result-checks'

/**
 * Every 15 minutes, gives each La Salle fixture throwing off in the next two days a
 * cron-job.org result check an hour after throw-off (see resultCheck.ts), and moves
 * the check of any fixture whose throw-off changed. Fixtures already scheduled cost
 * nothing, so the short interval only means a re-dated match is picked up quickly.
 */
export const resultChecksTask: TaskConfig<{
  input: Record<string, never>
  output: { scheduled: number; deferred: number; errors: number }
}> = {
  slug: 'scheduleResultChecks',
  label: 'Schedule fixture result checks',
  schedule: [{ cron: '0 */15 * * * *', queue: RESULT_CHECKS_QUEUE }],
  retries: 0,
  outputSchema: [
    { name: 'scheduled', type: 'number' },
    { name: 'deferred', type: 'number' },
    { name: 'errors', type: 'number' },
  ],
  handler: async ({ req }) => {
    const result = await scheduleResultChecks(req.payload)
    if (result.scheduled.length || result.errors.length) {
      req.payload.logger.info({ msg: 'Fixture result checks scheduled', ...result })
    }
    return {
      output: { scheduled: result.scheduled.length, deferred: result.deferred, errors: result.errors.length },
    }
  },
}
