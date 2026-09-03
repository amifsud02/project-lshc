import { createHash, randomBytes } from 'crypto'
import { createLocalReq, type Payload } from 'payload'
import { getAppUrl } from './google'
import { safeRedirectPath } from './session'

/** How long a sign-in link stays valid, in milliseconds. */
export const MAGIC_LINK_TTL_MS = 15 * 60 * 1000

/** Most links one address may request inside a single TTL window. */
const MAX_LINKS_PER_WINDOW = 5

import { type MagicLinkError } from './magicLinkMessages'

export { magicLinkErrorMessages, type MagicLinkError } from './magicLinkMessages'

const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex')

export const normalizeEmail = (value: unknown): null | string => {
  if (typeof value !== 'string') return null
  const email = value.trim().toLowerCase()
  // Deliberately loose: the mailbox has to exist for the link to work anyway.
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null
  return email
}

const cleanName = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined
  const name = value.trim().slice(0, 80)
  return name.length > 0 ? name : undefined
}

export type MagicLinkRequest = {
  email: string
  firstName?: unknown
  lastName?: unknown
  redirectTo?: unknown
}

/**
 * Mints a single-use link. Returns null when the address has hit its rate
 * limit, so the caller can still answer "sent" without leaking anything.
 */
export async function createMagicLink(
  payload: Payload,
  request: MagicLinkRequest,
): Promise<null | { expiresAt: Date; url: string }> {
  const req = await createLocalReq({}, payload)
  const email = request.email
  const windowStart = new Date(Date.now() - MAGIC_LINK_TTL_MS).toISOString()

  const { totalDocs: recent } = await payload.count({
    collection: 'magic-link-tokens',
    overrideAccess: true,
    req,
    where: { and: [{ email: { equals: email } }, { createdAt: { greater_than: windowStart } }] },
  })
  if (recent >= MAX_LINKS_PER_WINDOW) return null

  // Tidy up anything this address can no longer use.
  await payload.delete({
    collection: 'magic-link-tokens',
    overrideAccess: true,
    req,
    where: {
      and: [
        { email: { equals: email } },
        { or: [{ usedAt: { exists: true } }, { expiresAt: { less_than: new Date().toISOString() } }] },
      ],
    },
  })

  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_MS)

  await payload.create({
    collection: 'magic-link-tokens',
    data: {
      email,
      expiresAt: expiresAt.toISOString(),
      firstName: cleanName(request.firstName),
      lastName: cleanName(request.lastName),
      redirectTo: safeRedirectPath(request.redirectTo),
      tokenHash: hashToken(token),
    },
    overrideAccess: true,
    req,
  })

  const url = new URL('/login/verify', getAppUrl().replace(/\/$/, ''))
  url.searchParams.set('token', token)

  return { expiresAt, url: url.toString() }
}

export type ConsumedMagicLink = {
  email: string
  firstName?: string | null
  lastName?: string | null
  redirectTo: string
}

/** Marks a link as used and returns who it was for. Each link works exactly once. */
export async function consumeMagicLink(
  payload: Payload,
  token: unknown,
): Promise<{ error: MagicLinkError } | { link: ConsumedMagicLink }> {
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{40,60}$/.test(token)) return { error: 'invalid' }

  const req = await createLocalReq({}, payload)
  const { docs } = await payload.find({
    collection: 'magic-link-tokens',
    limit: 1,
    overrideAccess: true,
    req,
    where: { tokenHash: { equals: hashToken(token) } },
  })
  const doc = docs[0]
  if (!doc) return { error: 'invalid' }
  if (doc.usedAt) return { error: 'used' }
  if (new Date(doc.expiresAt) <= new Date()) return { error: 'expired' }

  // Claim it before signing anyone in, so two clicks in quick succession
  // cannot both succeed.
  const usedAt = new Date().toISOString()
  const claimed = await payload.update({
    collection: 'magic-link-tokens',
    data: { usedAt },
    overrideAccess: true,
    req,
    where: { and: [{ id: { equals: doc.id } }, { usedAt: { exists: false } }] },
  })
  if (claimed.docs.length !== 1) return { error: 'used' }

  return {
    link: {
      email: doc.email,
      firstName: doc.firstName,
      lastName: doc.lastName,
      redirectTo: safeRedirectPath(doc.redirectTo),
    },
  }
}
