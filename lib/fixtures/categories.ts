/** The age/gender groups fixtures are filtered by on the site. Stored on each competition. */
export const FIXTURE_CATEGORIES = ['men', 'women', 'u19', 'youth'] as const
export type FixtureCategory = (typeof FIXTURE_CATEGORIES)[number]

export const FIXTURE_CATEGORY_LABELS: Record<FixtureCategory, string> = {
  men: 'Men',
  women: 'Women',
  u19: 'U19',
  youth: 'Youth',
}

export const FIXTURE_CATEGORY_OPTIONS = [
  { label: 'Men (senior)', value: 'men' },
  { label: 'Women (senior)', value: 'women' },
  { label: 'U19 (men and women)', value: 'u19' },
  { label: 'Youth (U17 and younger)', value: 'youth' },
]

/** MHA category codes (SM, SW, U19M, U15B, ...) to our groups. */
export const categoryForMhaCode = (code: string): FixtureCategory | undefined => {
  const c = String(code ?? '').toUpperCase()
  if (c === 'SM') return 'men'
  if (c === 'SW') return 'women'
  if (c.startsWith('U19')) return 'u19'
  if (/^U\d+/.test(c)) return 'youth'
  return undefined
}

/** Best guess from a competition name, for competitions saved before the category existed. */
export const categoryFromCompetitionName = (name: string): FixtureCategory | undefined => {
  const n = String(name ?? '')
  if (/\bu-?19\b/i.test(n)) return 'u19'
  if (/\bu-?(8|10|11|13|14|15|16|17)\b|\bboys\b|\bgirls\b|\bnursery\b/i.test(n)) return 'youth'
  if (/\bwomen'?s?\b|\bladies\b/i.test(n)) return 'women'
  if (/\bmen'?s?\b/i.test(n)) return 'men'
  return undefined
}

export const isFixtureCategory = (value: unknown): value is FixtureCategory =>
  typeof value === 'string' && (FIXTURE_CATEGORIES as readonly string[]).includes(value)
