import type { Access, CollectionSlug, FieldAccess } from 'payload'

/**
 * Staff roles for the admin panel.
 *
 * A user with no roles is a storefront customer: they can hold an account and
 * place orders, but cannot enter the admin panel at all. Roles are only ever
 * granted by an admin — see the field access on `roles` in the Users collection.
 */
export const ROLES = [
  'admin',
  'content-creator',
  'coach',
  'competitions-manager',
  'shop-manager',
  'photographer',
  'nursery-manager',
] as const

export type Role = (typeof ROLES)[number]

export const roleOptions: { label: string; value: Role }[] = [
  { label: 'Admin', value: 'admin' },
  { label: 'Content Creator', value: 'content-creator' },
  { label: 'Coach', value: 'coach' },
  { label: 'Competitions Manager', value: 'competitions-manager' },
  { label: 'Shop Manager', value: 'shop-manager' },
  { label: 'Photographer', value: 'photographer' },
  { label: 'Nursery Manager', value: 'nursery-manager' },
]

/**
 * Which roles may create, update and delete in each collection.
 *
 * `admin` is implicit everywhere and is deliberately left out of the lists.
 * Everything absent from this map is admin-only. To retire a role, delete it
 * from `ROLES`/`roleOptions` and drop it from the lists below.
 */
const collectionEditors: Partial<Record<CollectionSlug, Role[]>> = {
  competitions: ['competitions-manager'],
  competitionTypes: ['competitions-manager'],
  fixtures: ['coach', 'competitions-manager'],
  galleries: ['content-creator', 'photographer'],
  'gallery-categories': ['content-creator', 'photographer'],
  media: ['content-creator', 'coach', 'shop-manager', 'photographer'],
  'nursery-categories': ['nursery-manager'],
  'nursery-registrations': ['nursery-manager'],
  'nursery-seasons': ['nursery-manager'],
  news: ['content-creator'],
  'news-categories': ['content-creator'],
  orders: ['shop-manager'],
  pages: ['content-creator'],
  players: ['coach'],
  products: ['shop-manager'],
  standings: ['coach', 'competitions-manager'],
  teams: ['coach', 'competitions-manager'],
  venues: ['coach', 'competitions-manager', 'nursery-manager'],
}

/** Accepts `unknown` so it stays usable against both `User` and raw database documents. */
export const getRoles = (user: unknown): Role[] => {
  const roles = (user as { roles?: unknown } | null)?.roles
  if (!Array.isArray(roles)) return []
  return roles.filter((role): role is Role => ROLES.includes(role as Role))
}

export const hasRole = (user: unknown, ...roles: Role[]): boolean => {
  const held = getRoles(user)
  return roles.some((role) => held.includes(role))
}

export const isAdmin = (user: unknown): boolean => hasRole(user, 'admin')

/** Any role at all is enough to reach the admin panel; what you see there depends on the role. */
export const isStaff = (user: unknown): boolean => getRoles(user).length > 0

export const canEditCollection = (slug: CollectionSlug, user: unknown): boolean =>
  isAdmin(user) || hasRole(user, ...(collectionEditors[slug] ?? []))

/** Write access (create/update/delete) for a collection, based on the matrix above. */
export const collectionWriteAccess =
  (slug: CollectionSlug): Access =>
  ({ req: { user } }) =>
    canEditCollection(slug, user)

export const adminOnly: Access = ({ req: { user } }) => isAdmin(user)

export const adminOnlyField: FieldAccess = ({ req: { user } }) => isAdmin(user)

/** Field-level access for a named set of roles. Admin always passes. */
export const roleFieldAccess =
  (...roles: Role[]): FieldAccess =>
  ({ req: { user } }) =>
    isAdmin(user) || hasRole(user, ...roles)

/** Staff see every draft; the public only ever sees published documents. */
export const publishedOrStaff: Access = ({ req: { user } }) => {
  if (isStaff(user)) return true
  return { _status: { equals: 'published' } }
}
