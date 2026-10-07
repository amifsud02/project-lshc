/**
 * Turns a wall-clock time in Malta into a UTC instant, so that summer and winter
 * kick-offs both land on the right hour. Guesses the offset, then re-checks it
 * against how the candidate instant actually renders in Europe/Malta.
 */
export const maltaTimeToUTC = (localTime: string): Date => {
  const [datePart, timePart] = localTime.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute] = timePart.split(':').map(Number)
  const asIfUTC = Date.UTC(year, month - 1, day, hour, minute)

  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Malta',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

  let candidate = asIfUTC
  for (let pass = 0; pass < 2; pass++) {
    const parts = Object.fromEntries(
      formatter.formatToParts(new Date(candidate)).map((p) => [p.type, p.value]),
    )
    const rendered = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour) % 24,
      Number(parts.minute),
    )
    if (rendered === asIfUTC) break
    candidate -= rendered - asIfUTC
  }

  return new Date(candidate)
}
