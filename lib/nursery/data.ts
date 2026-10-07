import { getPayload } from 'payload'
import config from '@payload-config'
import type { NurseryCategory, NurserySeason } from '@/payload-types'
import { cachedFind } from '@/lib/utils/payload/cached'

export type FeeTier = NonNullable<NurserySeason['feeTiers']>[number]

export type NurseryLetter = {
  season: NurserySeason
  categories: NurseryCategory[]
}

/** The one season marked active, or null when the club is between seasons. */
export async function getActiveSeason(): Promise<NurserySeason | null> {
  const payload = await getPayload({ config })
  const { docs } = await cachedFind({
    collection: 'nursery-seasons',
    where: { isActive: { equals: true } },
    limit: 1,
    depth: 1,
  })
  return (docs[0] as NurserySeason) ?? null
}

/** Categories for a season, venues resolved, in the order the admin set. */
export async function getSeasonCategories(seasonId: string): Promise<NurseryCategory[]> {
  const payload = await getPayload({ config })
  const { docs } = await cachedFind({
    collection: 'nursery-categories',
    where: { season: { equals: seasonId } },
    sort: 'displayOrder',
    limit: 100,
    depth: 1,
  })
  return docs as NurseryCategory[]
}

export async function getNurseryLetter(): Promise<NurseryLetter | null> {
  const season = await getActiveSeason()
  if (!season) return null
  const categories = await getSeasonCategories(String(season.id))
  return { season, categories }
}

export function isRegistrationOpen(season: NurserySeason, now: Date = new Date()): boolean {
  if (!season.isActive) return false
  if (season.registrationOpensAt && new Date(season.registrationOpensAt) > now) return false
  if (season.registrationClosesAt && new Date(season.registrationClosesAt) < now) return false
  return true
}

type ChildFilter = { birthYear: number; gender: 'boy' | 'girl' }

/**
 * Age groups overlap by design — a Year 4 child is eligible for both Under 8 and
 * Under 10 — so this narrows the list rather than choosing. The parent picks, and
 * the coaches move children between groups afterwards if needed.
 */
export function eligibleCategories(
  categories: NurseryCategory[],
  child: ChildFilter,
): NurseryCategory[] {
  return categories.filter((category) => {
    if (child.birthYear < category.birthYearFrom || child.birthYear > category.birthYearTo) {
      return false
    }
    if (category.gender === 'boys' && child.gender !== 'boy') return false
    if (category.gender === 'girls' && child.gender !== 'girl') return false
    return true
  })
}

/**
 * A group is offered every tier from its own minimum up to the number of
 * sessions it actually runs — Under 6 trains once a week, so it never sees the
 * two- and three-session prices, and Under 8 never sees a one-session price.
 */
export function tiersForCategory(season: NurserySeason, category: NurseryCategory): FeeTier[] {
  const sessionCount = category.sessions?.length ?? 0
  const minimum = category.minSessionsPerWeek ?? 1
  return (season.feeTiers ?? [])
    .filter((tier) => tier.sessionsPerWeek >= minimum && tier.sessionsPerWeek <= sessionCount)
    .sort((a, b) => a.sessionsPerWeek - b.sessionsPerWeek)
}

export const formatFee = (cents: number): string =>
  new Intl.NumberFormat('en-MT', { style: 'currency', currency: 'EUR' }).format((cents ?? 0) / 100)

export const formatLongDate = (value: string | Date): string =>
  new Date(value).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
