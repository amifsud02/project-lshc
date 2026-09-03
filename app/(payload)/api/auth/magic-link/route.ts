import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import payloadConfig from '@payload-config'
import { createMagicLink, normalizeEmail } from '@/lib/auth/magicLink'
import { sendMagicLinkEmail } from '@/lib/email/magicLink'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Emails a one-time sign-in link. The response is the same whether or not an
 * account exists, and whether or not the address is rate limited, so this
 * endpoint cannot be used to probe for customers.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Send a JSON body.' }, { status: 400 })
  }

  const email = normalizeEmail(body.email)
  if (!email) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
  }

  try {
    const payload = await getPayload({ config: payloadConfig })
    const link = await createMagicLink(payload, {
      email,
      firstName: body.firstName,
      lastName: body.lastName,
      redirectTo: body.redirectTo,
    })

    if (link) {
      await sendMagicLinkEmail({ email, expiresAt: link.expiresAt, url: link.url })
    } else {
      console.warn(`[magic link] rate limit reached for ${email}; not sending`)
    }
  } catch (err) {
    console.error('[magic link] could not create or send link', err)
    return NextResponse.json(
      { error: 'We could not send your link right now. Please try again.' },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true })
}
