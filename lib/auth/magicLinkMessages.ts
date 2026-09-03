/** Kept free of server imports so client components can use it. */
export type MagicLinkError = 'expired' | 'invalid' | 'used'

export const magicLinkErrorMessages: Record<MagicLinkError, string> = {
  expired: 'This sign-in link has expired. Request a new one below.',
  invalid: 'This sign-in link is not valid. Request a new one below.',
  used: 'This sign-in link has already been used. Request a new one below.',
}
