import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// Pages requested on every ping so the functions that render them stay warm too. Fixed list:
// the endpoint never fetches anything the caller supplies.
const WARM_PATHS = ['/']

const baseUrl = (request: NextRequest) => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  return request.nextUrl.origin
}

const authorised = (request: NextRequest) => {
  const token = process.env.WARM_TOKEN
  if (!token) return true // no token configured: open, but it does nothing beyond warming
  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  return bearer === token || request.nextUrl.searchParams.get('token') === token
}

const timed = async <T>(fn: () => Promise<T>): Promise<{ ok: boolean; ms: number }> => {
  const start = Date.now()
  try {
    await fn()
    return { ok: true, ms: Date.now() - start }
  } catch {
    return { ok: false, ms: Date.now() - start }
  }
}

/**
 * Keep-warm endpoint for an external pinger (UptimeRobot, cron-job.org, GitHub Actions, ...).
 * Boots Payload, makes one real round trip to MongoDB and requests the public pages in
 * WARM_PATHS. Set WARM_TOKEN to require `Authorization: Bearer <token>` or `?token=<token>`.
 */
export async function GET(request: NextRequest) {
  if (!authorised(request)) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const db = await timed(async () => {
    const payload = await getPayload({ config })
    await payload.find({ collection: 'pages', limit: 1, depth: 0, pagination: false })
  })

  const base = baseUrl(request)
  const pages = await Promise.all(
    WARM_PATHS.map(async (path) => ({
      path,
      ...(await timed(async () => {
        const res = await fetch(`${base}${path}`, {
          cache: 'no-store',
          signal: AbortSignal.timeout(20_000),
        })
        if (!res.ok) throw new Error(String(res.status))
      })),
    })),
  )

  return NextResponse.json(
    { ok: db.ok && pages.every((p) => p.ok), db, pages },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}

export const HEAD = async (request: NextRequest) => {
  const res = await GET(request)
  return new NextResponse(null, { status: res.status })
}
