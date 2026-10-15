import config from '@payload-config'
import { getPayload } from 'payload'

import { canEditCollection } from '@/lib/auth/roles'
import { createMatchSummaryPosts } from '@/lib/news/matchSummaries'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

/**
 * POST /api/match-summaries — writes the match summary post for one fixture, for
 * the "Write match summaries" bar on the Fixtures list.
 *
 * Body: `{ fixtureId, dryRun? }`, the Payload id of a fixture. The bar sends the
 * selected fixtures one at a time, so each request writes at most one post.
 * `dryRun` returns the text without saving.
 */
export async function POST(request: Request) {
  const payload = await getPayload({ config })

  const { user } = await payload.auth({ headers: request.headers })
  if (!canEditCollection('news', user)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const fixtureId = typeof body?.fixtureId === 'string' || typeof body?.fixtureId === 'number' ? body.fixtureId : null
  if (fixtureId == null) {
    return Response.json({ error: 'fixtureId is required' }, { status: 400 })
  }

  try {
    const fixture = await payload.findByID({ collection: 'fixtures', id: fixtureId, depth: 0, overrideAccess: true })
    if (!fixture.fixtureCode) {
      return Response.json({ error: 'This fixture has no MHA match id' }, { status: 422 })
    }

    const result = await createMatchSummaryPosts(payload, {
      dryRun: body?.dryRun === true,
      matchIds: [fixture.fixtureCode],
    })
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    payload.logger.error({ msg: `Match summary for fixture ${fixtureId} failed`, err })
    return Response.json(
      { error: err instanceof Error ? err.message : 'Match summary failed' },
      { status: 502 },
    )
  }
}
