import { randomBytes } from 'crypto'
import { getPayload } from 'payload'

import config from '../payload.config'
import { ROLES, type Role } from '../lib/auth/roles'

/**
 * Grants staff roles from the command line.
 *
 * Admin access is invite-only, so the very first admin cannot be created through
 * the admin panel — use this once to bootstrap yourself, then manage everyone
 * else under Users.
 *
 *   pnpm grant-role you@lasallehandball.com admin
 *   pnpm grant-role coach@lasallehandball.com coach photographer
 *
 * Roles replace whatever the user had; pass no roles to revoke admin access.
 */
const [email, ...roles] = process.argv.slice(2)

if (!email) {
  console.error('Usage: pnpm grant-role <email> [role...]')
  console.error(`Roles: ${ROLES.join(', ')}`)
  process.exit(1)
}

const invalid = roles.filter((role) => !ROLES.includes(role as Role))
if (invalid.length) {
  console.error(`Unknown role(s): ${invalid.join(', ')}`)
  console.error(`Roles: ${ROLES.join(', ')}`)
  process.exit(1)
}

const payload = await getPayload({ config })
const normalisedEmail = email.toLowerCase().trim()

const { docs } = await payload.find({
  collection: 'users',
  limit: 1,
  where: { email: { equals: normalisedEmail } },
})

if (docs.length) {
  await payload.update({
    collection: 'users',
    data: { roles: roles as Role[] },
    id: docs[0].id,
  })
  console.log(`Updated ${normalisedEmail} → [${roles.join(', ') || 'no roles'}]`)
} else {
  await payload.create({
    collection: 'users',
    data: {
      email: normalisedEmail,
      // Placeholder only: staff sign in with Google. Anyone who wants a
      // password can set one via "Forgot password?" on the login screen.
      password: randomBytes(32).toString('base64url'),
      roles: roles as Role[],
    },
  })
  console.log(`Created ${normalisedEmail} → [${roles.join(', ') || 'no roles'}]`)
}
