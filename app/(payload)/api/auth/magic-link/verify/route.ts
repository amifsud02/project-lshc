import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import payloadConfig from '@payload-config'
import { consumeMagicLink } from '@/lib/auth/magicLink'
import { createSessionCookie, findOrCreateCustomer, isLocked } from '@/lib/auth/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Redeems a sign-in link. Deliberately a POST that the verify page fires from
 * the browser, so link-scanning mail servers that prefetch URLs cannot burn the
 * token before the person gets to it.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 400 })
  }

  try {
    const payload = await getPayload({ config: payloadConfig })
    const result = await consumeMagicLink(payload, body.token)
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    const user = await findOrCreateCustomer(payload, {
      email: result.link.email,
      firstName: result.link.firstName,
      lastName: result.link.lastName,
    })
    if (isLocked(user)) {
      return NextResponse.json({ error: 'invalid' }, { status: 400 })
    }

    const response = NextResponse.json({ redirectTo: result.link.redirectTo })
    response.headers.append('Set-Cookie', await createSessionCookie(payload, user))
    return response
  } catch (err) {
    console.error('[magic link] could not verify link', err)
    return NextResponse.json({ error: 'server' }, { status: 500 })
  }
}
