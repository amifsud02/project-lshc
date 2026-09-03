import type { PayloadRequest } from 'payload'

/** Lowercases, strips accents and punctuation, and collapses runs of separators. */
export const slugify = (input: string): string =>
  input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/** The calendar date of the kick-off as it reads in Malta, e.g. "2026-04-18". */
export const maltaDatePart = (startDate: string | Date): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Malta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(startDate))

type TeamRef = string | number | { id?: string | number; slug?: string; teamName?: string } | null

/**
 * Relationship values arrive either populated or as a bare id depending on the
 * depth of the request, so fall back to a lookup when the slug isn't to hand.
 */
const teamSlug = async (team: TeamRef, req: PayloadRequest): Promise<string | null> => {
  if (!team) return null

  if (typeof team === 'object') {
    if (team.slug) return team.slug
    if (team.teamName) return slugify(team.teamName)
  }

  const id = typeof team === 'object' ? team.id : team
  if (!id) return null

  const doc = await req.payload.findByID({ collection: 'teams', id, depth: 0 })
  return doc?.slug ?? (doc?.teamName ? slugify(doc.teamName) : null)
}

/**
 * Builds the public match-report slug, e.g.
 * "la-salle-handball-club-vs-kavallieri-handball-club-2026-04-18".
 *
 * Double-headers between the same two clubs on the same day would collide, so a
 * numeric suffix is added when the base slug is already taken by another fixture.
 */
export const buildFixtureSlug = async ({
  homeTeam,
  awayTeam,
  startDate,
  currentId,
  req,
}: {
  homeTeam: TeamRef
  awayTeam: TeamRef
  startDate: string | Date
  currentId?: string | number
  req: PayloadRequest
}): Promise<string | null> => {
  const [home, away] = await Promise.all([teamSlug(homeTeam, req), teamSlug(awayTeam, req)])
  if (!home || !away || !startDate) return null

  const base = `${home}-vs-${away}-${maltaDatePart(startDate)}`

  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`
    const { docs } = await req.payload.find({
      collection: 'fixtures',
      where: { slug: { equals: candidate } },
      limit: 1,
      depth: 0,
      pagination: false,
    })
    const clash = docs[0]
    if (!clash || String(clash.id) === String(currentId)) return candidate
  }

  return base
}
