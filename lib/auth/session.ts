import { randomBytes } from 'crypto'
import { createLocalReq, getFieldsToSign, jwtSign, type Payload } from 'payload'
import { addSessionToUser, generatePayloadCookie } from 'payload/shared'
import type { User } from '@/payload-types'

/** The raw database document, before Payload strips its internal auth fields. */
export type SessionUser = User & { _strategy?: string; lockUntil?: string | null }

/** Reads a raw user document straight from the database, sessions included. */
export async function findRawUserByEmail(payload: Payload, email: string): Promise<SessionUser | null> {
  const req = await createLocalReq({}, payload)
  return (await payload.db.findOne({
    collection: 'users',
    req,
    where: { email: { equals: email.toLowerCase().trim() } },
  })) as SessionUser | null
}

export const isLocked = (user: SessionUser): boolean =>
  Boolean(user.lockUntil && new Date(user.lockUntil) > new Date())

type CustomerDetails = {
  email: string
  firstName?: string | null
  googleSub?: string | null
  lastName?: string | null
}

/**
 * Finds the storefront customer for a verified email address, creating one when
 * none exists. New customers hold no roles, so they never reach the admin panel.
 * Names only ever fill blanks; a Google account ID is linked when supplied.
 */
export async function findOrCreateCustomer(
  payload: Payload,
  details: CustomerDetails,
): Promise<SessionUser> {
  const email = details.email.toLowerCase().trim()
  const req = await createLocalReq({}, payload)
  const existing = await findRawUserByEmail(payload, email)

  if (existing) {
    const patch: Partial<User> = {}
    if (!existing.firstName && details.firstName) patch.firstName = details.firstName
    if (!existing.lastName && details.lastName) patch.lastName = details.lastName
    if (details.googleSub && existing.googleSub !== details.googleSub) patch.googleSub = details.googleSub

    if (Object.keys(patch).length > 0) {
      await payload.update({ collection: 'users', data: patch, id: existing.id, overrideAccess: true, req })
      Object.assign(existing, patch)
    }
    return existing
  }

  // Passwordless accounts still need a local password on the record. Nobody
  // ever learns this one; the user can set their own via "forgot password".
  await payload.create({
    collection: 'users',
    data: {
      email,
      firstName: details.firstName ?? undefined,
      googleSub: details.googleSub ?? undefined,
      lastName: details.lastName ?? undefined,
      password: randomBytes(32).toString('base64url'),
    },
    overrideAccess: true,
    req,
  })

  const created = await findRawUserByEmail(payload, email)
  if (!created) throw new Error('User was created but could not be read back')
  return created
}

/** Starts a Payload session for the user and returns the `Set-Cookie` header value. */
export async function createSessionCookie(payload: Payload, user: SessionUser): Promise<string> {
  const collectionConfig = payload.collections.users.config
  const req = await createLocalReq({}, payload)

  user.collection = 'users'
  user._strategy = 'local-jwt'

  const { sid } = await addSessionToUser({ collectionConfig, payload, req, user })

  const { token } = await jwtSign({
    fieldsToSign: getFieldsToSign({ collectionConfig, email: user.email, sid, user }),
    secret: payload.secret,
    tokenExpiration: collectionConfig.auth.tokenExpiration,
  })

  return generatePayloadCookie({
    collectionAuthConfig: collectionConfig.auth,
    cookiePrefix: payload.config.cookiePrefix,
    token,
  })
}

/** Only ever follow same-origin paths after sign-in, never an absolute or protocol-relative URL. */
export const safeRedirectPath = (candidate: unknown, fallback = '/account'): string => {
  if (typeof candidate !== 'string') return fallback
  const value = candidate.trim()
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\') || /[\r\n]/.test(value)) {
    return fallback
  }
  return value
}
