import { draftMode } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

import { isStaff } from '@/lib/auth/roles'

export const dynamic = 'force-dynamic'

/**
 * GET /api/preview?path=/membership — lets signed-in staff see a page's latest
 * draft on the real site before publishing it. `?exit=1` switches back.
 */
export async function GET(request: NextRequest) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  if (!isStaff(user)) {
    return new NextResponse('Sign in to the admin to preview drafts.', { status: 401 })
  }

  const draft = await draftMode()
  if (request.nextUrl.searchParams.get('exit')) {
    draft.disable()
  } else {
    draft.enable()
  }

  // Only same-site paths, so this can't be used as an open redirect.
  const path = request.nextUrl.searchParams.get('path') ?? '/'
  const safePath = path.startsWith('/') && !path.startsWith('//') ? path : '/'
  return NextResponse.redirect(new URL(safePath, request.nextUrl.origin))
}
