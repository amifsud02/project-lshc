/** Full names for the venue codes stored on fixtures; unknown codes are shown as they are. */
export const VENUE_NAMES: Record<string, string> = {
  USH: 'University Sports Hall (USH)',
  KSH: 'Kirkop Sports Hall',
}

export const venueName = (code?: string): string | undefined =>
  code ? (VENUE_NAMES[code] ?? code) : undefined
