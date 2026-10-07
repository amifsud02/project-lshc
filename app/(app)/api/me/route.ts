import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'

/**
 * Who is looking at the site? Called by the navbar after the page has loaded so the pages
 * themselves never have to read cookies, which is what lets them be cached.
 */
export async function GET() {
  const user = await getCurrentUser()
  return NextResponse.json(
    { authed: Boolean(user), isAdmin: Boolean(user?.isAdmin) },
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
}
