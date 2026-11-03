/** The squad pages under /teams/<squad>/<position>, and the sponsor name each squad plays under. */
export const SQUADS = {
  'men-first-team': { label: "Men's first team", pageName: 'La Salle Karrettun' },
  'women-first-team': { label: "Women's first team", pageName: 'La Salle Universal Air' },
  'u21-mens-team': { label: "Under-21 men's team", pageName: 'La Salle MBI' },
  'u21-womens-team': { label: "Under-21 women's team", pageName: 'La Salle Metalco' },
} as const

export type Squad = keyof typeof SQUADS

export const SQUAD_OPTIONS = Object.entries(SQUADS).map(([value, { label }]) => ({ label, value }))

/** The position tabs: URL segment, heading and the player position it lists. */
export const SQUAD_TABS = [
  { slug: 'all', label: 'All' },
  { slug: 'goalkeepers', label: 'Goalkeepers', position: 'Goalkeeper' },
  { slug: 'line-players', label: 'Line players', position: 'LinePlayer' },
  { slug: 'wingers', label: 'Wingers', position: 'Winger' },
  { slug: 'play-makers', label: 'Play makers', position: 'PlayMaker' },
  { slug: 'lateral', label: 'Lateral', position: 'Lateral' },
  { slug: 'coach', label: 'Coach', position: 'Coach' },
] as const
