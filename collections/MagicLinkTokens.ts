import type { CollectionConfig } from 'payload'

/**
 * One-time sign-in links for the storefront. Only the SHA-256 hash of a token is
 * stored, so a database read never yields a usable link. Rows are written and
 * consumed exclusively through the local API with `overrideAccess`.
 */
export const MagicLinkTokens: CollectionConfig = {
  slug: 'magic-link-tokens',
  access: {
    create: () => false,
    delete: () => false,
    read: () => false,
    update: () => false,
  },
  admin: { hidden: true },
  fields: [
    { name: 'tokenHash', type: 'text', index: true, required: true, unique: true },
    { name: 'email', type: 'email', index: true, required: true },
    { name: 'firstName', type: 'text' },
    { name: 'lastName', type: 'text' },
    { name: 'redirectTo', type: 'text' },
    { name: 'expiresAt', type: 'date', index: true, required: true },
    { name: 'usedAt', type: 'date' },
  ],
  timestamps: true,
}
