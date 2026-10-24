import type { PayloadRequest } from 'payload'

import type { Player } from '@/payload-types'
import { paths } from '@/lib/seo/site'
import { slugify } from '@/lib/utils/fixtureSlug'

export const POSITION_LABELS: Record<NonNullable<Player['position']>, string> = {
  Goalkeeper: 'Goalkeeper',
  LinePlayer: 'Line player',
  Winger: 'Winger',
  PlayMaker: 'Playmaker',
  Lateral: 'Back',
  Coach: 'Coach',
}

export const positionLabel = (position?: Player['position']): string | undefined =>
  position ? POSITION_LABELS[position] : undefined

export const playerName = (p: Pick<Player, 'firstName' | 'lastName'>): string =>
  `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim()

const listFormat = new Intl.ListFormat('en-GB', { type: 'conjunction' })

/** The names of every squad the player is on, their main one first. */
export const playerTeams = (player: Pick<Player, 'team' | 'otherTeams'>): string[] => {
  const names = [player.team, ...(player.otherTeams ?? [])]
    .map((t) => (t && typeof t === 'object' ? t.teamName : undefined))
    .filter((n): n is string => !!n)
  return [...new Set(names)]
}

/** "2026 - 2027" (as the MHA writes it) → "2026/27". */
export const seasonLabel = (season?: string | null): string | undefined => {
  const m = season?.match(/(\d{4})\D+\d{2}(\d{2})/)
  return m ? `${m[1]}/${m[2]}` : season || undefined
}

/**
 * The opening sentence of a profile and its meta description, written only from what
 * the record holds, e.g. "Jake Camilleri is a playmaker at La Salle Handball Club in
 * Malta, wearing number 1."
 */
export const describePlayer = (player: Player): { lead: string; description: string } => {
  const name = playerName(player)
  const label = positionLabel(player.position)
  const isCoach = player.position === 'Coach'

  const role = label ? `is a ${label.toLowerCase()}` : 'plays'
  const named = playerTeams(player).filter((t) => !/^la salle( handball club)?$/i.test(t))
  const squad = named.length
    ? `, in the ${listFormat.format(named)} squad${named.length > 1 ? 's' : ''}`
    : ''
  const number = typeof player.number === 'number' && !isCoach ? `, wearing number ${player.number}` : ''
  const lead = `${name} ${role} at La Salle Handball Club in Malta${squad}${number}.`

  const stats = player.seasonStats
  const season = seasonLabel(stats?.season)
  const record = stats?.appearances
    ? ` ${season ? `In ${season}` : 'This season'}: ${stats.appearances} appearances and ${stats.goals ?? 0} goals.`
    : ''

  return { lead, description: `${lead}${record}` }
}

/** The public profile path, only for players whose profile page is switched on. */
export const playerProfilePath = (p: unknown): string | null => {
  if (!p || typeof p !== 'object') return null
  const { profilePage, slug } = p as Pick<Player, 'profilePage' | 'slug'>
  return profilePage && slug ? paths.player(slug) : null
}

/**
 * Builds the profile slug from the player's name, e.g. "jake-camilleri". Two players
 * with the same name get a numeric suffix on the second, as fixtures do.
 */
export const buildPlayerSlug = async ({
  firstName,
  lastName,
  currentId,
  req,
}: {
  firstName?: string | null
  lastName?: string | null
  currentId?: string | number
  req: PayloadRequest
}): Promise<string | null> => {
  const base = slugify(`${firstName ?? ''} ${lastName ?? ''}`)
  if (!base) return null

  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`
    const { docs } = await req.payload.find({
      collection: 'players',
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
