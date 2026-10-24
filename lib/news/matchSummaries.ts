import { FinishReason, GoogleGenAI } from '@google/genai'
import type { Payload } from 'payload'
import { z } from 'zod'

import { categoryForMhaCode, FIXTURE_CATEGORIES } from '@/lib/fixtures/categories'
import { fetchMhaFixtures, fetchMhaMatchReport, type MhaFixture, type MhaMatchReport } from '@/lib/mha/client'
import { cleanTeamName, competitionNameFor, MHA_CATEGORY_LABELS } from '@/lib/mha/mapFixture'
import { MHA_CLUB_NAME } from '@/lib/mha/syncFixtures'
import { p, richText } from '@/lib/seed/lexical'
import { slugify } from '@/lib/utils/fixtureSlug'

/**
 * Match round-ups: one news post a week covering every La Salle match played that
 * week (HMS, Team Haier and every youth side included — MHA files them all under the
 * "La Salle" club), written from the MHA match reports and told from La Salle's side.
 *
 * A week is written once every La Salle match in it has been played and its MHA report
 * is out, or GRACE_DAYS after the week ends with whatever is in by then: a match still
 * without a report is given with its score only. Each post lists the matches it covers
 * in `news.mhaMatchIds`, so no match is covered twice and re-running is harmless. Posts
 * are drafts for an editor to check, add a photo and publish, unless
 * MATCH_SUMMARY_AUTOPUBLISH=true.
 *
 * Run nightly by matchSummariesTask.ts, and by hand from /api/cron/match-summaries or
 * the bar on the Fixtures list. The text is written by Google Gemini when
 * GEMINI_API_KEY is set, and from a plain template otherwise (or if the model fails).
 */

export const NEWS_CATEGORY_SLUG = 'match-reports'
const NEWS_CATEGORY_TITLE = 'Match Reports'

/** How far back to look for finished matches without a post. */
const DEFAULT_LOOKBACK_DAYS = 7

/** Days after a week ends (Sunday) before it is written with reports still missing. */
const GRACE_DAYS = 2

/** Override with GEMINI_MODEL, e.g. "gemini-4-argon" for the flagship model. */
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash'

export type SkippedMatch = {
  matchId: string
  game: string
  date: string
  reason: string
  /** The post the match is already in. */
  newsId?: string | number
}

export type RoundUpItem = {
  /** Monday of the week, "YYYY-MM-DD". */
  week: string
  /** The match dates covered, e.g. "10–11 October 2026". */
  label: string
  action: 'created' | 'waiting' | 'error'
  reason?: string
  matches: { matchId: string; game: string; date: string; reportAvailable: boolean }[]
  title?: string
  writer?: 'gemini' | 'template'
  newsId?: string | number
  /** Dry runs only: the text that would be posted. */
  description?: string
  paragraphs?: string[]
}

export type MatchSummaryResult = {
  dryRun: boolean
  /** Weeks left for the next run because the time budget ran out. */
  remaining: number
  roundUps: RoundUpItem[]
  skipped: SkippedMatch[]
}

type Options = {
  dryRun?: boolean
  lookbackDays?: number
  /**
   * Only these matches, e.g. ["MHA-FIX-2026-00457"], whatever their date. They are
   * written straight away, a round-up per week, without waiting for the rest of the
   * week. Each one left out is reported back with the reason.
   */
  matchIds?: string[]
  /** Epoch ms after which no new week is started. */
  deadline?: number
  now?: Date
}

const isOurs = (club: string) => club === MHA_CLUB_NAME

const isFinished = (f: MhaFixture) =>
  f.isFinished || ['FINISHED', 'ENDED'].includes(String(f.status ?? '').toUpperCase())

/** Scheduled or under way. A postponed or cancelled match doesn't hold its week back. */
const isStillToPlay = (f: MhaFixture) =>
  !isFinished(f) && (f.isLive || ['UPCOMING', 'LIVE'].includes(String(f.status ?? '').toUpperCase()))

const maltaDate = (date: Date) => date.toLocaleDateString('en-CA', { timeZone: 'Europe/Malta' })

const errorMessage = (err: unknown) => (err instanceof Error ? err.message : String(err))

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

/* ------------------------------------------------------------------ */
/* Weeks                                                               */
/* ------------------------------------------------------------------ */

const addDays = (date: string, days: number) =>
  new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10)

/** Monday of the week a "YYYY-MM-DD" date falls in. */
const weekOf = (date: string) => addDays(date, -((new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7))

const dayMonth = (date: string, options: Intl.DateTimeFormatOptions) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', { timeZone: 'UTC', ...options })

/** "10 October 2026", "10–11 October 2026" or "30 September – 4 October 2026". */
export const dateRangeLabel = (first: string, last: string) => {
  if (first === last) return dayMonth(first, { day: 'numeric', month: 'long', year: 'numeric' })
  const sameMonth = first.slice(0, 7) === last.slice(0, 7)
  const sameYear = first.slice(0, 4) === last.slice(0, 4)
  const start = dayMonth(first, sameMonth ? { day: 'numeric' } : sameYear ? { day: 'numeric', month: 'long' } : { day: 'numeric', month: 'long', year: 'numeric' })
  return `${start}${sameMonth ? '–' : ' – '}${dayMonth(last, { day: 'numeric', month: 'long', year: 'numeric' })}`
}

/* ------------------------------------------------------------------ */
/* Facts: each match told from La Salle's side                         */
/* ------------------------------------------------------------------ */

type Side = 'home' | 'away'

const minuteOf = (event: { displayTime: string }) => {
  const minute = Number(String(event.displayTime ?? '').split(':')[0])
  return Number.isFinite(minute) ? minute : null
}

/** Running score at fixed points and the biggest leads, home side first, from the match log. */
const scoreFlow = (report: MhaMatchReport) => {
  const goals = (report.events ?? []).filter((e) => /^(Goal|Penalty Scored|Manual Score Added)$/i.test(e.eventType))
  const scoreAt = [10, 20, 30, 40, 50].flatMap((minute) => {
    const last = goals.filter((e) => (minuteOf(e) ?? Infinity) <= minute).at(-1)
    return last ? [{ minute, home: last.homeScore, away: last.awayScore }] : []
  })

  let biggestHomeLead = 0
  let biggestAwayLead = 0
  let leadChanges = 0
  let leader: Side | null = null
  for (const e of goals) {
    const diff = e.homeScore - e.awayScore
    biggestHomeLead = Math.max(biggestHomeLead, diff)
    biggestAwayLead = Math.max(biggestAwayLead, -diff)
    const now: Side | null = diff > 0 ? 'home' : diff < 0 ? 'away' : leader
    if (leader && now && now !== leader) leadChanges++
    if (diff !== 0) leader = now
  }

  return { scoreAt, biggestHomeLead, biggestAwayLead, leadChanges }
}

/** The order matches appear in: first teams, then other senior sides, U19 and youth. */
const matchRank = (f: MhaFixture, side: Side) => {
  const group = categoryForMhaCode(f.category)
  const groupRank = group ? FIXTURE_CATEGORIES.indexOf(group) : FIXTURE_CATEGORIES.length
  // "TEAM-LASALLE-SM-001" is the first team, "-002" (HMS) the second, and so on.
  const teamNumber = Number((side === 'home' ? f.homeTeamId : f.awayTeamId).match(/(\d+)$/)?.[1] ?? 99)
  return [groupRank, teamNumber, f.date, f.throwOff ?? ''] as const
}

const compareRank = (a: readonly (string | number)[], b: readonly (string | number)[]) => {
  for (let i = 0; i < a.length; i++) {
    if (a[i] < b[i]) return -1
    if (a[i] > b[i]) return 1
  }
  return 0
}

export type RoundUpMatchFacts = ReturnType<typeof laSalleMatchFacts>

/**
 * One match as the round-up tells it: La Salle's team and score first, its scorers and
 * MVPs only, the opponent only as the team played. Players in under-19 and youth sides
 * are children, so their names are left out altogether.
 */
export const laSalleMatchFacts = (fixture: MhaFixture, report: MhaMatchReport | null) => {
  const team = (side: Side) => cleanTeamName((side === 'home' ? report?.homeTeam : report?.awayTeam) || (side === 'home' ? fixture.homeTeam : fixture.awayTeam))
  const ourSides: Side[] = (['home', 'away'] as const).filter((s) => isOurs(s === 'home' ? fixture.homeClub : fixture.awayClub))
  const derby = ourSides.length === 2
  const us: Side = ourSides[0] ?? 'home'
  const them: Side = us === 'home' ? 'away' : 'home'

  const homeScore = report?.homeScore ?? fixture.homeScore ?? 0
  const awayScore = report?.awayScore ?? fixture.awayScore ?? 0
  const ours = us === 'home' ? homeScore : awayScore
  const theirs = us === 'home' ? awayScore : homeScore
  const orient = (home: number, away: number) => (us === 'home' ? `${home}-${away}` : `${away}-${home}`)

  const group = categoryForMhaCode(fixture.category)
  const children = group === 'u19' || group === 'youth'

  const flow = report ? scoreFlow(report) : null
  const players = (side: Side) => (side === 'home' ? report?.homePlayers : report?.awayPlayers) ?? []

  return {
    matchId: fixture.matchId,
    date: fixture.date,
    day: dayMonth(fixture.date, { weekday: 'long' }),
    // The report's name is sometimes only the category code ("U17B"); the feed's is the full one.
    competition: competitionNameFor(fixture),
    category: MHA_CATEGORY_LABELS[fixture.category] ?? fixture.category,
    /** The La Salle team, or both in an in-club derby such as Team Haier v HMS. */
    laSalleTeams: ourSides.map(team),
    opponent: derby ? null : team(them),
    derby,
    outcome: derby ? 'derby' : ours > theirs ? 'won' : ours < theirs ? 'lost' : 'drew',
    /** La Salle's score first; home first in a derby. */
    score: orient(homeScore, awayScore),
    halfTime:
      report?.halfTimeHome != null && report?.halfTimeAway != null ? orient(report.halfTimeHome, report.halfTimeAway) : null,
    scoreAt: flow?.scoreAt.map((s) => `${s.minute}': ${orient(s.home, s.away)}`) ?? [],
    biggestLaSalleLead: flow ? (us === 'home' ? flow.biggestHomeLead : flow.biggestAwayLead) : null,
    biggestOpponentLead: flow && !derby ? (us === 'home' ? flow.biggestAwayLead : flow.biggestHomeLead) : null,
    leadChanges: flow?.leadChanges ?? null,
    laSalleScorers: children
      ? []
      : ourSides.flatMap((side) =>
          players(side)
            .filter((pl) => pl.goals > 0)
            .sort((a, b) => b.goals - a.goals)
            .slice(0, 4)
            .map((pl) => ({ name: pl.name, goals: pl.goals, ...(derby ? { team: team(side) } : {}) })),
        ),
    laSalleMvp: children ? [] : ourSides.flatMap((side) => players(side).filter((pl) => pl.isMvp).map((pl) => pl.name)),
    playerNamesWithheld: children,
    /** False when the MHA score sheet isn't out yet: give the result only. */
    reportAvailable: Boolean(report),
    rank: matchRank(fixture, us),
  }
}

/* ------------------------------------------------------------------ */
/* Writing                                                             */
/* ------------------------------------------------------------------ */

const Summary = z.object({
  title: z
    .string()
    .describe('Headline, at most 90 characters, naming the week\'s standout La Salle result or team, e.g. "HMS and Leapmotor lead a winning weekend for La Salle"'),
  description: z.string().describe('One or two sentence excerpt for news cards, at most 200 characters, about La Salle.'),
  paragraphs: z.array(z.string()).describe('The article body: an opening paragraph, then the matches. Plain text paragraphs.'),
})

export type WrittenSummary = z.infer<typeof Summary> & { writer: 'gemini' | 'template' }

const SYSTEM_PROMPT = `You write the weekly match round-up for the news page of La Salle Handball Club in Malta.

Each request gives you, as JSON, every La Salle match played in one week, from the Malta Handball Association's official score sheets. La Salle fields several teams, many under sponsor names such as "HMS", "Team Haier" and "La Salle Leapmotor", plus youth sides. All of them are La Salle teams, and they are the story.

Write one round-up that shines a light on the La Salle teams:
- Every paragraph is about La Salle. Name the La Salle team first and tell each match from its side. Call each La Salle team exactly by the name given ("HMS", not "La Salle HMS"). The opponent appears only as the team La Salle played: never praise, profile or name opposition players.
- Open with a short paragraph on the week's best La Salle moments: wins, standout scorers, MVPs, a fightback. Then cover the matches in the order given, giving the first teams the most room, and put the youth results together in one paragraph near the end.
- In a defeat, stay positive and honest: lead with what La Salle did well (a top scorer, a strong spell, a close finish) and never dwell on mistakes. Never claim a win, a lead or a comeback that the data does not show.
- When "derby" is true both sides are La Salle teams: celebrate both and take no side.
- Use only the facts given. Never invent quotes, tactics, injuries, crowd details, weather, league positions, form, streaks or upcoming fixtures. If "reportAvailable" is false, give that match's result only.
- Name players only from "laSalleScorers" and "laSalleMvp". When "playerNamesWithheld" is true the players are children: praise the team and name no one.
- Scores are given with La Salle's score first: keep that order and use an en dash, e.g. 28–24. Use British English and handball terms (throw-off, 7-metre, two-minute suspension).
- Roughly 50–90 words per senior match and one or two sentences per youth match. No headings, lists, markdown or emoji.`

const geminiClient = () =>
  process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null

const writeWithGemini = async (client: GoogleGenAI, label: string, matches: RoundUpMatchFacts[]) => {
  const response = await client.models.generateContent({
    model: MODEL,
    contents: JSON.stringify({ week: label, matches: matches.map(({ rank: _rank, ...m }) => m) }, null, 2),
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: 'application/json',
      responseJsonSchema: z.toJSONSchema(Summary),
      abortSignal: AbortSignal.timeout(90_000),
    },
  })

  const finish = response.candidates?.[0]?.finishReason
  if (finish && finish !== FinishReason.STOP) throw new Error(`Gemini stopped early (${finish})`)
  if (!response.text) throw new Error('Gemini returned no round-up')
  const parsed = Summary.parse(JSON.parse(response.text))
  if (!parsed.paragraphs.length) throw new Error('Gemini returned an empty round-up')
  return parsed
}

const dash = (score: string) => score.replace('-', '–')

const listOf = (items: string[]) =>
  items.length < 2 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`

const resultLine = (m: RoundUpMatchFacts) => {
  const [team, other] = m.laSalleTeams
  const score = dash(m.score)
  const result =
    m.outcome === 'derby'
      ? `${team} and ${other} met in a La Salle derby, finishing ${score}`
      : m.outcome === 'won'
        ? `${team} beat ${m.opponent} ${score}`
        : m.outcome === 'drew'
          ? `${team} drew ${score} with ${m.opponent}`
          : `${team} went down ${score} to ${m.opponent}`
  return `${result} in the ${m.competition} on ${m.day}.`
}

/** Plain fallback when there is no API key or the model call fails. */
export const writeFromTemplate = (label: string, matches: RoundUpMatchFacts[]): z.infer<typeof Summary> => {
  const senior = matches.filter((m) => !m.playerNamesWithheld)
  const youth = matches.filter((m) => m.playerNamesWithheld)
  const wins = matches.filter((m) => m.outcome === 'won').flatMap((m) => m.laSalleTeams)

  const seniorParagraph = (m: RoundUpMatchFacts) =>
    [
      resultLine(m),
      m.halfTime ? `It was ${dash(m.halfTime)} at half-time.` : '',
      m.laSalleScorers.length
        ? `Leading the way for La Salle: ${listOf(m.laSalleScorers.slice(0, 3).map((s) => `${s.name} (${s.goals})`))}.`
        : '',
      m.laSalleMvp.length ? `Player of the match: ${listOf(m.laSalleMvp)}.` : '',
    ]
      .filter(Boolean)
      .join(' ')

  return {
    title: wins.length ? `Wins for ${listOf([...new Set(wins)].slice(0, 2))}: La Salle round-up` : `La Salle round-up: ${label}`,
    description: `Results from ${plural(matches.length, 'La Salle match')} on ${label}${wins.length ? `, with ${plural(wins.length, 'win')}` : ''}.`,
    paragraphs: [
      matches.length === 1
        ? `How La Salle got on, ${label}.`
        : `Here are the results from La Salle's ${matches.length} matches on ${label}.`,
      ...senior.map(seniorParagraph),
      ...(youth.length ? [youth.map(resultLine).join(' ')] : []),
    ],
  }
}

export const writeRoundUp = async (
  label: string,
  matches: RoundUpMatchFacts[],
  payload?: Payload,
): Promise<WrittenSummary> => {
  const client = geminiClient()
  if (client) {
    try {
      return { ...(await writeWithGemini(client, label, matches)), writer: 'gemini' }
    } catch (err) {
      payload?.logger.warn({ msg: 'Match round-up: Gemini failed, using template', err })
    }
  }
  return { ...writeFromTemplate(label, matches), writer: 'template' }
}

/* ------------------------------------------------------------------ */
/* Posting                                                             */
/* ------------------------------------------------------------------ */

const matchReportsCategoryId = async (payload: Payload, dryRun: boolean) => {
  const found = await payload.find({
    collection: 'news-categories',
    where: { slug: { equals: NEWS_CATEGORY_SLUG } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  if (found.docs[0]) return found.docs[0].id
  if (dryRun) return null
  const created = await payload.create({
    collection: 'news-categories',
    data: { title: NEWS_CATEGORY_TITLE, slug: NEWS_CATEGORY_SLUG },
    overrideAccess: true,
  })
  return created.id
}

const fallbackImageId = async (payload: Payload) => {
  const general = await payload.findGlobal({ slug: 'general', depth: 0, overrideAccess: true })
  const image = general?.general?.fallbackImage
  return image && typeof image === 'object' ? image.id : (image ?? null)
}

/** Match id -> id of the post that already covers it: a round-up, or an older one-match report. */
const postedMatchIds = async (payload: Payload, matchIds: string[]) => {
  if (!matchIds.length) return new Map<string, string | number>()
  const existing = await payload.find({
    collection: 'news',
    where: { or: [{ mhaMatchId: { in: matchIds } }, { mhaMatchIds: { in: matchIds } }] },
    draft: true,
    pagination: false,
    depth: 0,
    overrideAccess: true,
    select: { mhaMatchId: true, mhaMatchIds: true },
  })
  return new Map(
    existing.docs.flatMap((d) =>
      [d.mhaMatchId, ...(d.mhaMatchIds ?? [])].filter((id): id is string => Boolean(id)).map((id) => [id, d.id] as const),
    ),
  )
}

const game = (f: MhaFixture) => `${cleanTeamName(f.homeTeam)} v ${cleanTeamName(f.awayTeam)}`
const describe = (f: MhaFixture) => ({ matchId: f.matchId, game: game(f), date: f.date })

/**
 * Writes a round-up for each week with finished La Salle matches not yet covered: the
 * weeks in the last `lookbackDays`, once each is complete, or the given `matchIds`
 * straight away.
 */
export const createMatchSummaryPosts = async (
  payload: Payload,
  { dryRun = false, lookbackDays = DEFAULT_LOOKBACK_DAYS, matchIds, deadline, now = new Date() }: Options = {},
): Promise<MatchSummaryResult> => {
  const { fixtures } = await fetchMhaFixtures()
  const today = maltaDate(now)
  const ours = fixtures.filter((f) => isOurs(f.homeClub) || isOurs(f.awayClub))
  const result: MatchSummaryResult = { dryRun, remaining: 0, roundUps: [], skipped: [] }

  let pool: MhaFixture[]
  if (matchIds) {
    // Picked by hand: say why each one that cannot be written is left out.
    pool = []
    for (const id of matchIds) {
      const fixture = ours.find((f) => f.matchId === id)
      if (!fixture) result.skipped.push({ matchId: id, game: id, date: '', reason: 'Not a La Salle match in the MHA feed' })
      else if (!isFinished(fixture)) result.skipped.push({ ...describe(fixture), reason: 'Match not finished yet' })
      else pool.push(fixture)
    }
  } else {
    // Whole weeks, so a week that started before the window is still complete.
    const since = weekOf(maltaDate(new Date(now.getTime() - lookbackDays * 86_400_000)))
    pool = ours.filter((f) => f.date >= since && f.date <= today)
  }

  const posted = await postedMatchIds(payload, pool.map((f) => f.matchId))
  if (matchIds) {
    for (const f of pool.filter((c) => posted.has(c.matchId))) {
      result.skipped.push({ ...describe(f), reason: 'Already in a post', newsId: posted.get(f.matchId) })
    }
  }

  const weeks = new Map<string, MhaFixture[]>()
  for (const f of pool) weeks.set(weekOf(f.date), [...(weeks.get(weekOf(f.date)) ?? []), f])
  const todo = [...weeks.entries()]
    .map(([week, matches]) => ({ week, matches, toCover: matches.filter((f) => isFinished(f) && !posted.has(f.matchId)) }))
    .filter((w) => w.toCover.length)
    .sort((a, b) => a.week.localeCompare(b.week))
  if (!todo.length) return result

  const categoryId = await matchReportsCategoryId(payload, dryRun)
  const imageId = await fallbackImageId(payload)
  const publish = process.env.MATCH_SUMMARY_AUTOPUBLISH === 'true'

  for (const [index, { week, matches, toCover }] of todo.entries()) {
    if (index > 0 && deadline && Date.now() > deadline) {
      result.remaining = todo.length - index
      break
    }

    const dates = toCover.map((f) => f.date).sort()
    const item: RoundUpItem = {
      week,
      label: dateRangeLabel(dates[0], dates.at(-1)!),
      action: 'waiting',
      matches: toCover.map((f) => ({ ...describe(f), reportAvailable: false })),
    }
    result.roundUps.push(item)
    const graceOver = today >= addDays(week, 6 + GRACE_DAYS)

    try {
      const stillToPlay = matches.filter(isStillToPlay)
      if (!matchIds && !graceOver && stillToPlay.length) {
        item.reason = `${plural(stillToPlay.length, 'La Salle match')} still to play this week`
        continue
      }

      // null when MHA hasn't published the report yet; any other failure stops the week.
      const reports = await Promise.all(toCover.map((f) => fetchMhaMatchReport(f.matchId)))
      item.matches = toCover.map((f, i) => ({ ...describe(f), reportAvailable: Boolean(reports[i]) }))
      const missing = reports.filter((r) => !r).length
      if (!matchIds && !graceOver && missing) {
        item.reason = `Waiting for ${plural(missing, 'MHA match report')}`
        continue
      }

      const facts = toCover
        .map((f, i) => laSalleMatchFacts(f, reports[i]))
        .sort((a, b) => compareRank(a.rank, b.rank))
      const summary = await writeRoundUp(item.label, facts, payload)
      Object.assign(item, { action: 'created', title: summary.title, writer: summary.writer, reason: undefined })

      if (dryRun) {
        Object.assign(item, { description: summary.description, paragraphs: summary.paragraphs })
        continue
      }
      if (!categoryId) throw new Error('No Match Reports news category')

      // A draft may be saved without its required fields; a published post needs the image.
      const status = publish && imageId ? 'published' : 'draft'
      const lastDate = dates.at(-1)!
      const doc = await payload.create({
        collection: 'news',
        draft: status === 'draft',
        overrideAccess: true,
        data: {
          title: summary.title,
          slug: `${slugify(summary.title)}-${lastDate}`,
          category: categoryId,
          publishedAt: new Date(`${lastDate}T12:00:00Z`).toISOString(),
          description: summary.description,
          // Drafts skip required-field validation, so a missing fallback image is fine there.
          featuredImage: imageId as string,
          tags: ['Match Report', 'Round-up', ...new Set(facts.map((m) => m.category))],
          content: richText(...summary.paragraphs.map(p)),
          mhaMatchIds: toCover.map((f) => f.matchId),
          _status: status,
        },
      })
      item.newsId = doc.id
    } catch (err) {
      payload.logger.error({ msg: `Match round-up for the week of ${week} failed`, err })
      Object.assign(item, { action: 'error', reason: errorMessage(err) })
    }
  }

  return result
}
