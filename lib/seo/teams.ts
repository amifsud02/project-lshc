import type { Metadata, ResolvingMetadata } from 'next'
import { notFound } from 'next/navigation'
import { siteOpenGraph } from '@/lib/utils/metadata'

/** The squad pages under /teams/<team>/<position>; "all" lists everyone. */
export const SQUAD_POSITIONS = ['all', 'goalkeepers', 'line-players', 'wingers', 'play-makers', 'lateral', 'coach']

const TEAMS: Record<string, { name: string; noun: string }> = {
  'men-first-team': { name: "Men's first team", noun: "men's first team" },
  'women-first-team': { name: "Women's first team", noun: "women's first team" },
  'u21-mens-team': { name: "Under-21 men's team", noun: "under-21 men's team" },
  'u21-womens-team': { name: "Under-21 women's team", noun: "under-21 women's team" },
}

const positionLabel = (position: string) =>
  position === 'all' ? 'squad' : position.replace(/-/g, ' ')

/**
 * Metadata for a squad page. The pages are client components, so their layouts call this.
 * Unknown positions answer 404 rather than repeating the full squad under another URL.
 */
export async function squadMetadata(
  team: keyof typeof TEAMS,
  position: string,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  if (!SQUAD_POSITIONS.includes(position.toLowerCase())) notFound()
  const { name, noun } = TEAMS[team]
  const label = positionLabel(position.toLowerCase())
  const title = position === 'all' ? `${name} squad` : `${name}: ${label}`
  const description =
    position === 'all'
      ? `Players and coaches in La Salle Handball Club's ${noun}, Malta.`
      : `The ${label} in La Salle Handball Club's ${noun}, Malta.`
  const url = `/teams/${team}/${position.toLowerCase()}`
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: await siteOpenGraph(parent, { title, description, url }),
  }
}
