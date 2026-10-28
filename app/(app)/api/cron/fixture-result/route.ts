import config from '@payload-config'
import { getPayload } from 'payload'

import { checkFixtureResult, MAX_RETRIES } from '@/lib/mha/resultCheck'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * POST /api/cron/fixture-result — one result check, called by the cron-job.org job
 * that lib/mha/resultCheck.ts schedules an hour after a La Salle fixture's throw-off.
 *
 * Body: `{ fixtureId, retryCount }`, where `fixtureId` is the MHA match id
 * ("MHA-FIX-…", our `fixtureCode`). Syncs that match and its line-ups from MHA; if
 * it is not finished yet the job is moved 15 minutes on with `retryCount + 1`, up
 * to five retries. Needs `Authorization: Bearer $CRON_SECRET`.
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const fixtureId = typeof body?.fixtureId === 'string' ? body.fixtureId.trim() : ''
  const retryCount = Number(body?.retryCount ?? 0)
  if (!fixtureId || !Number.isInteger(retryCount) || retryCount < 0 || retryCount > MAX_RETRIES) {
    return Response.json({ error: 'Expected { fixtureId, retryCount }' }, { status: 400 })
  }

  const payload = await getPayload({ config })
  try {
    const result = await checkFixtureResult(payload, { fixtureId, retryCount })
    payload.logger.info({ msg: 'Fixture result check', ...result })
    // A failed MHA sync that was still rescheduled shows up as a failed run on cron-job.org.
    return Response.json(result, { status: result.error ? 502 : 200, headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    payload.logger.error({ msg: `Fixture result check failed for ${fixtureId}`, err })
    return Response.json(
      { error: err instanceof Error ? err.message : 'Fixture result check failed' },
      { status: 502 },
    )
  }
}
