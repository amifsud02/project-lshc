import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(relativeTime)

const DISPLAY_TZ = 'Europe/Malta'

/** "3 hours ago" for the last day, "Yesterday", the weekday within a week, then a date. */
export function relativeDate(value: string): string {
  const d = dayjs(value).tz(DISPLAY_TZ)
  const now = dayjs().tz(DISPLAY_TZ)
  const days = now.startOf('day').diff(d.startOf('day'), 'day')
  if (days <= 0) return d.from(now)
  if (days === 1) return 'Yesterday'
  if (days < 7) return d.format('dddd')
  return d.format(d.year() === now.year() ? 'D MMM' : 'D MMM YYYY')
}
