import { createHash, randomBytes, timingSafeEqual } from 'crypto'

export const GOOGLE_AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
export const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'

export const OAUTH_STATE_COOKIE = 'lshc-google-oauth-state'
export const OAUTH_VERIFIER_COOKIE = 'lshc-google-oauth-verifier'
/** Remembers who started the handshake (admin panel or storefront) and where to land afterwards. */
export const OAUTH_CONTEXT_COOKIE = 'lshc-google-oauth-context'

/**
 * `admin` is invite-only and restricted to the Workspace domain. `site` is the
 * storefront: any verified Google account may sign in, and a customer account is
 * created on first use.
 */
export type GoogleAudience = 'admin' | 'site'

export type OAuthContext = { audience: GoogleAudience; redirectTo: string }

export const encodeOAuthContext = (context: OAuthContext): string =>
  Buffer.from(JSON.stringify(context)).toString('base64url')

export const decodeOAuthContext = (raw: null | string): OAuthContext => {
  const fallback: OAuthContext = { audience: 'admin', redirectTo: '/admin' }
  if (!raw) return fallback
  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'))
    const audience: GoogleAudience = parsed?.audience === 'site' ? 'site' : 'admin'
    const redirectTo = typeof parsed?.redirectTo === 'string' ? parsed.redirectTo : fallback.redirectTo
    return { audience, redirectTo }
  } catch {
    return fallback
  }
}

/** How long the user has to complete the round trip to Google, in seconds. */
export const OAUTH_HANDSHAKE_TTL = 600

const DEFAULT_WORKSPACE_DOMAIN = 'lasallehandball.com'

export type GoogleOAuthConfig = {
  allowedDomains: string[]
  clientId: string
  clientSecret: string
  redirectUri: string
}

/** Claims we care about from Google's ID token. */
export type GoogleIdTokenClaims = {
  aud?: string
  email?: string
  email_verified?: boolean | string
  exp?: number
  family_name?: string
  given_name?: string
  hd?: string
  iss?: string
  sub?: string
}

export type GoogleSignInError =
  | 'access_denied'
  | 'exchange_failed'
  | 'invalid_state'
  | 'no_account'
  | 'no_roles'
  | 'not_configured'
  | 'server_error'
  | 'wrong_domain'

/** Copy shown on the storefront sign-in page. Customers never see the admin-only codes. */
export const siteGoogleSignInErrorMessages: Record<GoogleSignInError, string> = {
  access_denied: 'Google sign-in was cancelled. You can try again or use an email link instead.',
  exchange_failed: 'Google could not confirm your sign-in. Please try again.',
  invalid_state: 'That sign-in attempt expired. Please try again.',
  no_account: 'Something went wrong while signing you in. Please try again.',
  no_roles: 'Something went wrong while signing you in. Please try again.',
  not_configured: 'Google sign-in is not available right now. Use an email link instead.',
  server_error: 'Something went wrong while signing you in. Please try again.',
  wrong_domain: 'Something went wrong while signing you in. Please try again.',
}

export const googleSignInErrorMessages: Record<GoogleSignInError, string> = {
  access_denied: 'Google sign-in was cancelled.',
  exchange_failed: 'Google could not confirm your sign-in. Please try again.',
  invalid_state: 'Your sign-in session expired. Please try again.',
  no_account: 'No admin account exists for that address. Ask an administrator to create one.',
  no_roles: 'Your account has no staff role yet. Ask an administrator to grant you one.',
  not_configured: 'Google sign-in is not configured on this site.',
  server_error: 'Something went wrong while signing you in. Please try again.',
  wrong_domain: 'Use your @lasallehandball.com account to sign in.',
}

export const getAppUrl = (): string =>
  process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

/** Workspace domains allowed into the admin panel. Comma-separated to support aliases. */
export const getAllowedDomains = (): string[] =>
  (process.env.GOOGLE_WORKSPACE_DOMAIN ?? DEFAULT_WORKSPACE_DOMAIN)
    .split(',')
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean)

export const isGoogleSignInConfigured = (): boolean =>
  Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)

export const getGoogleOAuthConfig = (): GoogleOAuthConfig | null => {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) return null

  return {
    allowedDomains: getAllowedDomains(),
    clientId,
    clientSecret,
    redirectUri: `${getAppUrl().replace(/\/$/, '')}/api/oauth/google/callback`,
  }
}

export const createOAuthState = (): string => randomBytes(32).toString('base64url')

export const createPkcePair = (): { challenge: string; verifier: string } => {
  const verifier = randomBytes(32).toString('base64url')
  const challenge = createHash('sha256').update(verifier).digest('base64url')
  return { challenge, verifier }
}

export const safeCompare = (a: string, b: string): boolean => {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

/**
 * Reads the claims out of an ID token.
 *
 * The token is only ever read straight off Google's token endpoint over TLS, so
 * per OIDC §3.1.3.7 the signature does not need re-verifying here — but the
 * claims themselves still do, in `assertAllowedGoogleIdentity`.
 */
export const decodeIdTokenClaims = (idToken: string): GoogleIdTokenClaims | null => {
  const segments = idToken.split('.')
  if (segments.length !== 3) return null

  try {
    return JSON.parse(Buffer.from(segments[1], 'base64url').toString('utf8'))
  } catch {
    return null
  }
}

/**
 * Checks that the ID token was minted by Google for this client, is still
 * valid, and carries a verified email. Says nothing about *which* accounts are
 * welcome — see `assertWorkspaceDomain` for the admin panel's extra rule.
 */
export const verifyGoogleIdentity = (
  claims: GoogleIdTokenClaims | null,
  config: GoogleOAuthConfig,
): GoogleSignInError | null => {
  if (!claims) return 'exchange_failed'

  const validIssuer = claims.iss === 'accounts.google.com' || claims.iss === 'https://accounts.google.com'
  if (!validIssuer || claims.aud !== config.clientId) return 'exchange_failed'
  if (typeof claims.exp === 'number' && claims.exp * 1000 <= Date.now()) return 'exchange_failed'

  const emailVerified = claims.email_verified === true || claims.email_verified === 'true'
  const email = claims.email?.toLowerCase().trim()
  if (!email || !emailVerified || !claims.sub) return 'exchange_failed'

  return null
}

/** Admin panel only: the account must belong to one of the allowed Workspace domains. */
export const assertWorkspaceDomain = (
  claims: GoogleIdTokenClaims,
  config: GoogleOAuthConfig,
): GoogleSignInError | null => {
  // `hd` is the Workspace domain the account belongs to; consumer accounts have none.
  const hostedDomain = claims.hd?.toLowerCase()
  const emailDomain = claims.email!.toLowerCase().trim().split('@')[1]
  const allowed =
    Boolean(hostedDomain) &&
    config.allowedDomains.includes(hostedDomain!) &&
    config.allowedDomains.includes(emailDomain)

  return allowed ? null : 'wrong_domain'
}

/** Returns an error code when the identity may not enter the admin panel, or null when it may. */
export const assertAllowedGoogleIdentity = (
  claims: GoogleIdTokenClaims | null,
  config: GoogleOAuthConfig,
): GoogleSignInError | null => verifyGoogleIdentity(claims, config) ?? assertWorkspaceDomain(claims!, config)

export const buildGoogleAuthorizeUrl = ({
  audience = 'admin',
  challenge,
  config,
  state,
}: {
  audience?: GoogleAudience
  challenge: string
  config: GoogleOAuthConfig
  state: string
}): string => {
  const url = new URL(GOOGLE_AUTHORIZE_URL)
  url.searchParams.set('client_id', config.clientId)
  url.searchParams.set('redirect_uri', config.redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'openid email profile')
  url.searchParams.set('state', state)
  url.searchParams.set('code_challenge', challenge)
  url.searchParams.set('code_challenge_method', 'S256')
  url.searchParams.set('access_type', 'online')
  url.searchParams.set('prompt', 'select_account')
  // A hint only — Google still returns accounts outside the domain, so the
  // `hd` claim is re-checked server side after the exchange.
  if (audience === 'admin' && config.allowedDomains.length === 1) {
    url.searchParams.set('hd', config.allowedDomains[0])
  }
  return url.toString()
}
