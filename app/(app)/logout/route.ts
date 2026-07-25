import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

export const runtime = 'nodejs'

async function doLogout() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'
  const reqHeaders = await headers()
  const cookie = reqHeaders.get('cookie') ?? ''
  try {
    await fetch(`${appUrl}/api/users/logout`, {
      method: 'POST',
      headers: { cookie },
    })
  } catch (err) {
    console.error('[logout] failed to call payload logout', err)
  }
  const res = NextResponse.redirect(new URL('/', appUrl))
  res.cookies.set('payload-token', '', { maxAge: 0, path: '/' })
  return res
}

export async function GET() {
  return doLogout()
}

export async function POST() {
  return doLogout()
}
