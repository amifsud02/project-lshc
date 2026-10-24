import config from '@payload-config'
import { getPayload } from 'payload'

import { canEditCollection } from '@/lib/auth/roles'
import { createMatchSummaryPosts } from '@/lib/news/matchSummaries'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/** Weeks started after this long are left for another run, well inside `maxDuration`. */
const TIME_BUDGET_MS = 200_000

/**
 * POST /api/match-summaries — writes a round-up of the selected fixtures, one per
 * week, for the "Match round-ups" bar on the Fixtures list.
 *
 * Body: `{ fixtureIds, dryRun? }`, the Payload ids of the fixtures. `dryRun` returns
 * the text without saving.
 */
export async function POST(request: Request) {
  const started = Date.now()
  const payload = await getPayload({ config })

  const { user } = await payload.auth({ headers: request.headers })
  if (!canEditCollection('news', user)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const fixtureIds: (string | number)[] = Array.isArray(body?.fixtureIds)
    ? body.fixtureIds.filter((id: unknown) => typeof id === 'string' || typeof id === 'number')
    : []
  if (!fixtureIds.length) {
    return Response.json({ error: 'fixtureIds is required' }, { status: 400 })
  }

  try {
    const { docs } = await payload.find({
      collection: 'fixtures',
      where: { id: { in: fixtureIds } },
      depth: 0,
      limit: fixtureIds.length,
      overrideAccess: true,
      select: { fixtureCode: true },
    })
    const matchIds = docs.flatMap((f) => (f.fixtureCode ? [f.fixtureCode] : []))
    if (!matchIds.length) {
      return Response.json({ error: 'None of these fixtures has an MHA match id' }, { status: 422 })
    }

    const result = await createMatchSummaryPosts(payload, {
      dryRun: body?.dryRun === true,
      matchIds,
      deadline: started + TIME_BUDGET_MS,
    })
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    payload.logger.error({ msg: 'Match round-up from the Fixtures list failed', err })
    return Response.json(
      { error: err instanceof Error ? err.message : 'Match round-up failed' },
      { status: 502 },
    )
  }
}
