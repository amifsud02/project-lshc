export const DAY_OPTIONS = [
  { label: 'Monday', value: 'monday' },
  { label: 'Tuesday', value: 'tuesday' },
  { label: 'Wednesday', value: 'wednesday' },
  { label: 'Thursday', value: 'thursday' },
  { label: 'Friday', value: 'friday' },
  { label: 'Saturday', value: 'saturday' },
  { label: 'Sunday', value: 'sunday' },
] as const

export type Day = (typeof DAY_OPTIONS)[number]['value']

const DAY_INDEX: Record<Day, number> = {
  monday: 0,
  tuesday: 1,
  wednesday: 2,
  thursday: 3,
  friday: 4,
  saturday: 5,
  sunday: 6,
}

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

export const isValidTime = (value: unknown): boolean =>
  typeof value === 'string' && TIME_PATTERN.test(value)

export const dayLabel = (day: string): string =>
  DAY_OPTIONS.find((option) => option.value === day)?.label ?? day

/** `17:00` → `5:00 p.m.`, matching how the club writes times to parents. */
export const formatTime = (value: string): string => {
  if (!isValidTime(value)) return value
  const [rawHours, minutes] = value.split(':')
  const hours = Number(rawHours)
  const suffix = hours < 12 ? 'a.m.' : 'p.m.'
  const display = hours % 12 === 0 ? 12 : hours % 12
  return `${display}:${minutes} ${suffix}`
}

export const formatTimeRange = (start: string, end: string): string =>
  `${formatTime(start)} – ${formatTime(end)}`

type SortableSession = { day?: string | null; startTime?: string | null }

/** Monday-first, then by start time, so the printed schedule reads like a week. */
export const sortSessions = <T extends SortableSession>(sessions: T[]): T[] =>
  [...sessions].sort((a, b) => {
    const dayDiff =
      (DAY_INDEX[a.day as Day] ?? 99) - (DAY_INDEX[b.day as Day] ?? 99)
    if (dayDiff !== 0) return dayDiff
    return String(a.startTime ?? '').localeCompare(String(b.startTime ?? ''))
  })
