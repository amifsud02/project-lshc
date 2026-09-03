import { NextResponse } from 'next/server'
import {
  buildGoogleAuthorizeUrl,
  createOAuthState,
  createPkcePair,
  encodeOAuthContext,
  getAppUrl,
  getGoogleOAuthConfig,
  OAUTH_CONTEXT_COOKIE,
  OAUTH_HANDSHAKE_TTL,
  OAUTH_STATE_COOKIE,
  OAUTH_VERIFIER_COOKIE,
  type GoogleAudience,
  type OAuthContext,
} from '@/lib/auth/google'
import { safeRedirectPath } from '@/lib/auth/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Starts the Google handshake. `?for=site` is the storefront (customers, any
 * Google account); anything else is the admin panel. `?redirect=/path` is where
 * a storefront visitor lands afterwards.
 */
export async function GET(req: Request) {
  const appUrl = getAppUrl().replace(/\/$/, '')
  const config = getGoogleOAuthConfig()
  const params = new URL(req.url).searchParams

  const audience: GoogleAudience = params.get('for') === 'site' ? 'site' : 'admin'
  const context: OAuthContext = {
    audience,
    redirectTo: audience === 'site' ? safeRedirectPath(params.get('redirect')) : '/admin',
  }

  if (!config) {
    const loginPath = audience === 'site' ? '/login' : '/admin/login'
    return NextResponse.redirect(`${appUrl}${loginPath}?google=not_configured`)
  }

  const state = createOAuthState()
  const { challenge, verifier } = createPkcePair()

  const response = NextResponse.redirect(buildGoogleAuthorizeUrl({ audience, challenge, config, state }))

  const cookieOptions = {
    httpOnly: true,
    maxAge: OAUTH_HANDSHAKE_TTL,
    path: '/',
    // Lax so the cookies survive the top-level GET redirect back from Google.
    sameSite: 'lax' as const,
    secure: appUrl.startsWith('https://'),
  }

  response.cookies.set(OAUTH_STATE_COOKIE, state, cookieOptions)
  response.cookies.set(OAUTH_VERIFIER_COOKIE, verifier, cookieOptions)
  response.cookies.set(OAUTH_CONTEXT_COOKIE, encodeOAuthContext(context), cookieOptions)

  return response
}
