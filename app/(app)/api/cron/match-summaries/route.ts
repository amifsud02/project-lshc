import config from '@payload-config'
import { NextRequest } from 'next/server'
import { getPayload } from 'payload'

import { canEditCollection } from '@/lib/auth/roles'
import { createMatchSummaryPosts } from '@/lib/news/matchSummaries'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/** Matches started after this long are left for the next run, well inside `maxDuration`. */
const TIME_BUDGET_MS = 200_000

/**
 * GET /api/cron/match-summaries — writes a weekly round-up for each recent week of
 * La Salle matches that is complete and not yet covered (see lib/news/matchSummaries.ts).
 *
 * The nightly run is a Payload job (lib/news/matchSummariesTask.ts); this endpoint
 * is for running it by hand. Staff who can edit news may call it while signed in:
 * `?dryRun=1` writes nothing and returns the text; `?matchId=MHA-FIX-…,MHA-FIX-…`
 * writes a round-up of those matches straight away; `?days=14` widens the window.
 * An external scheduler can call it with `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(request: NextRequest) {
  const started = Date.now()
  const payload = await getPayload({ config })

  const secret = process.env.CRON_SECRET
  const fromCron = Boolean(secret) && request.headers.get('authorization') === `Bearer ${secret}`
  if (!fromCron) {
    const { user } = await payload.auth({ headers: request.headers })
    if (!canEditCollection('news', user)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const params = request.nextUrl.searchParams
  const days = Number(params.get('days'))

  try {
    const result = await createMatchSummaryPosts(payload, {
      dryRun: params.get('dryRun') === '1' || params.get('dryRun') === 'true',
      matchIds: params.get('matchId')?.split(',').filter(Boolean),
      lookbackDays: Number.isInteger(days) && days > 0 && days <= 60 ? days : undefined,
      deadline: started + TIME_BUDGET_MS,
    })
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    payload.logger.error({ msg: 'Match summaries failed', err })
    return Response.json(
      { error: err instanceof Error ? err.message : 'Match summaries failed' },
      { status: 502 },
    )
  }
}
