import { NextResponse } from 'next/server'
import { createLocalReq, getPayload } from 'payload'
import payloadConfig from '@payload-config'
import { isStaff } from '@/lib/auth/roles'
import {
  assertWorkspaceDomain,
  decodeIdTokenClaims,
  decodeOAuthContext,
  getAppUrl,
  getGoogleOAuthConfig,
  GOOGLE_TOKEN_URL,
  OAUTH_CONTEXT_COOKIE,
  OAUTH_STATE_COOKIE,
  OAUTH_VERIFIER_COOKIE,
  safeCompare,
  verifyGoogleIdentity,
  type GoogleSignInError,
  type OAuthContext,
} from '@/lib/auth/google'
import {
  createSessionCookie,
  findOrCreateCustomer,
  findRawUserByEmail,
  isLocked,
  safeRedirectPath,
} from '@/lib/auth/session'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const appUrl = () => getAppUrl().replace(/\/$/, '')

const clearHandshakeCookies = (response: NextResponse) => {
  for (const name of [OAUTH_STATE_COOKIE, OAUTH_VERIFIER_COOKIE, OAUTH_CONTEXT_COOKIE]) {
    response.cookies.set(name, '', { maxAge: 0, path: '/' })
  }
  return response
}

const loginPath = (context: OAuthContext) => (context.audience === 'site' ? '/login' : '/admin/login')

const fail = (context: OAuthContext, error: GoogleSignInError) => {
  const url = new URL(`${appUrl()}${loginPath(context)}`)
  url.searchParams.set('google', error)
  if (context.audience === 'site' && context.redirectTo !== '/account') {
    url.searchParams.set('redirect', context.redirectTo)
  }
  return clearHandshakeCookies(NextResponse.redirect(url))
}

export async function GET(req: Request) {
  const context = decodeOAuthContext(getCookie(req, OAUTH_CONTEXT_COOKIE))
  const config = getGoogleOAuthConfig()
  if (!config) return fail(context, 'not_configured')

  const url = new URL(req.url)

  if (url.searchParams.get('error')) {
    return fail(
      context,
      url.searchParams.get('error') === 'access_denied' ? 'access_denied' : 'server_error',
    )
  }

  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const expectedState = getCookie(req, OAUTH_STATE_COOKIE)
  const verifier = getCookie(req, OAUTH_VERIFIER_COOKIE)

  if (!code || !state || !expectedState || !verifier || !safeCompare(state, expectedState)) {
    return fail(context, 'invalid_state')
  }

  let claims
  try {
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        code_verifier: verifier,
        grant_type: 'authorization_code',
        redirect_uri: config.redirectUri,
      }),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      method: 'POST',
    })

    if (!tokenRes.ok) {
      console.error('[google oauth] token exchange failed', tokenRes.status, await tokenRes.text())
      return fail(context, 'exchange_failed')
    }

    const tokens = (await tokenRes.json()) as { id_token?: string }
    claims = tokens.id_token ? decodeIdTokenClaims(tokens.id_token) : null
  } catch (err) {
    console.error('[google oauth] token exchange threw', err)
    return fail(context, 'exchange_failed')
  }

  const identityError = verifyGoogleIdentity(claims, config)
  if (identityError) return fail(context, identityError)

  const email = claims!.email!.toLowerCase().trim()

  try {
    const payload = await getPayload({ config: payloadConfig })

    if (context.audience === 'site') {
      // Storefront: any verified Google account is welcome. First sign-in
      // creates a customer account; later ones link by verified email.
      const user = await findOrCreateCustomer(payload, {
        email,
        firstName: claims!.given_name,
        googleSub: claims!.sub,
        lastName: claims!.family_name,
      })
      if (isLocked(user)) return fail(context, 'server_error')

      const response = clearHandshakeCookies(
        NextResponse.redirect(`${appUrl()}${safeRedirectPath(context.redirectTo)}`),
      )
      response.headers.append('Set-Cookie', await createSessionCookie(payload, user))
      return response
    }

    // Admin panel: Workspace accounts only, and invite only — an admin creates
    // the user and grants roles first. A valid Google account is never enough.
    const domainError = assertWorkspaceDomain(claims!, config)
    if (domainError) return fail(context, domainError)

    const user = await findRawUserByEmail(payload, email)
    if (!user) return fail(context, 'no_account')
    if (isLocked(user)) return fail(context, 'no_account')
    if (!isStaff(user)) return fail(context, 'no_roles')

    // Record which Google account signed in, without touching roles.
    if (user.googleSub !== claims!.sub) {
      const payloadReq = await createLocalReq({}, payload)
      await payload.update({
        collection: 'users',
        data: { googleSub: claims!.sub },
        id: user.id,
        req: payloadReq,
      })
      user.googleSub = claims!.sub
    }

    const response = clearHandshakeCookies(NextResponse.redirect(`${appUrl()}/admin`))
    response.headers.append('Set-Cookie', await createSessionCookie(payload, user))
    return response
  } catch (err) {
    console.error('[google oauth] could not establish a Payload session', err)
    return fail(context, 'server_error')
  }
}

function getCookie(req: Request, name: string): null | string {
  const header = req.headers.get('cookie')
  if (!header) return null

  for (const part of header.split(';')) {
    const [rawName, ...rest] = part.trim().split('=')
    if (rawName === name) return decodeURIComponent(rest.join('='))
  }

  return null
}
