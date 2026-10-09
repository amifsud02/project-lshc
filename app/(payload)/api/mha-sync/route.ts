import config from '@payload-config'
import { getPayload } from 'payload'

import { canEditCollection } from '@/lib/auth/roles'
import { runMhaSyncStage } from '@/lib/mha/syncFixtures'
import { SYNC_STAGES, type SyncStage } from '@/lib/mha/syncResult'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** Work started after this long is left for the next request, well inside `maxDuration`. */
const TIME_BUDGET_MS = 20_000

/**
 * POST /api/mha-sync — one step of the Malta Handball Association sync behind the
 * "Sync from MHA" panel on the Fixtures list.
 *
 * Body: `{ stage, offset, dryRun?, refreshLineups? }`. Each call runs `stage` from
 * `offset` for about 20 seconds and returns `nextOffset` (null once the stage is
 * done), so a full sync is a series of short requests instead of one that outlives
 * the serverless time limit. `dryRun` previews without writing; `refreshLineups`
 * re-reads every finished match's report.
 */
export async function POST(request: Request) {
  const started = Date.now()
  const payload = await getPayload({ config })

  const { user } = await payload.auth({ headers: request.headers })
  if (!canEditCollection('fixtures', user)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const stage: SyncStage = SYNC_STAGES.includes(body?.stage) ? body.stage : 'fixtures'
  const offset = Number.isInteger(body?.offset) && body.offset > 0 ? body.offset : 0

  try {
    const result = await runMhaSyncStage(payload, {
      stage,
      offset,
      dryRun: body?.dryRun === true,
      refreshLineups: body?.refreshLineups === true,
      deadline: started + TIME_BUDGET_MS,
    })
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    payload.logger.error({ msg: `MHA sync (${stage}) failed`, err })
    return Response.json(
      { error: err instanceof Error ? err.message : 'MHA sync failed' },
      { status: 502 },
    )
  }
}
