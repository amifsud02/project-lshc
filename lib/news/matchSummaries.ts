import { FinishReason, GoogleGenAI } from '@google/genai'
import type { Payload } from 'payload'
import { z } from 'zod'

import { fetchMhaFixtures, fetchMhaMatchReport, type MhaFixture, type MhaMatchReport } from '@/lib/mha/client'
import { competitionNameFor, MHA_CATEGORY_LABELS } from '@/lib/mha/mapFixture'
import { MHA_CLUB_NAME } from '@/lib/mha/syncFixtures'
import { p, richText } from '@/lib/seed/lexical'
import { slugify } from '@/lib/utils/fixtureSlug'

/**
 * Match summaries: after each La Salle match (HMS, Team Haier and every youth side
 * included — MHA files them all under the "La Salle" club), write a short news post
 * from the MHA match report.
 *
 * Run by the daily cron at /api/cron/match-summaries. Each match gets at most one
 * post, keyed on `news.mhaMatchId`, so re-running only picks up matches whose report
 * has appeared since. Posts are saved as drafts for an editor to check, add a photo
 * and publish — unless MATCH_SUMMARY_AUTOPUBLISH=true.
 *
 * The text is written by Google Gemini when GEMINI_API_KEY is set, and from a plain
 * template otherwise (or if the model call fails).
 */

export const NEWS_CATEGORY_SLUG = 'match-reports'
const NEWS_CATEGORY_TITLE = 'Match Reports'

/** How far back to look for finished matches without a post. */
const DEFAULT_LOOKBACK_DAYS = 7

/** Override with GEMINI_MODEL, e.g. "gemini-4-argon" for the flagship model. */
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash'

export type MatchSummaryItem = {
  matchId: string
  game: string
  date: string
  action: 'created' | 'skipped' | 'error'
  reason?: string
  title?: string
  writer?: 'gemini' | 'template'
  newsId?: string | number
}

export type MatchSummaryResult = {
  dryRun: boolean
  /** Finished matches in the window that still need a post but were left for the next run. */
  remaining: number
  items: MatchSummaryItem[]
}

type Options = {
  dryRun?: boolean
  lookbackDays?: number
  /** Only this match, e.g. "MHA-FIX-2026-00457". Ignores the date window and existing posts check. */
  matchId?: string
  /** Epoch ms after which no new match is started. */
  deadline?: number
  now?: Date
}

const isOurs = (club: string) => club === MHA_CLUB_NAME

const isFinished = (f: MhaFixture) =>
  f.isFinished || ['FINISHED', 'ENDED'].includes(String(f.status ?? '').toUpperCase())

const maltaDate = (date: Date) => date.toLocaleDateString('en-CA', { timeZone: 'Europe/Malta' })

const errorMessage = (err: unknown) => (err instanceof Error ? err.message : String(err))

/* ------------------------------------------------------------------ */
/* Facts: the report boiled down to what a writer needs                */
/* ------------------------------------------------------------------ */

type Side = 'home' | 'away'

export type MatchFacts = ReturnType<typeof matchFacts>

const minuteOf = (event: { time: string; displayTime: string }) => {
  const [mm] = String(event.displayTime ?? '').split(':')
  const minute = Number(mm)
  return Number.isFinite(minute) ? minute : null
}

/** Running score at fixed points, biggest leads and lead changes, from the match log. */
const scoreFlow = (report: MhaMatchReport) => {
  const goals = (report.events ?? []).filter((e) => /^(Goal|Penalty Scored|Manual Score Added)$/i.test(e.eventType))
  const checkpoints = [10, 20, 30, 40, 50]
  const scoreAt = checkpoints.flatMap((minute) => {
    const last = goals.filter((e) => (minuteOf(e) ?? Infinity) <= minute).at(-1)
    return last ? [`${minute}': ${last.homeScore}-${last.awayScore}`] : []
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

const teamSheet = (report: MhaMatchReport, side: Side) => {
  const players = side === 'home' ? report.homePlayers : report.awayPlayers
  const summary = side === 'home' ? report.homeSummary : report.awaySummary
  const suspensions = players.reduce(
    (n, pl) => n + [pl.twoMin1, pl.twoMin2, pl.twoMin3].filter(Boolean).length,
    0,
  )
  return {
    scorers: players
      .filter((pl) => pl.goals > 0)
      .sort((a, b) => b.goals - a.goals)
      .map((pl) => ({
        name: pl.name,
        goals: pl.goals,
        ...(pl.penaltyGiven ? { sevenMetres: `${pl.penaltyScored}/${pl.penaltyGiven}` } : {}),
      })),
    sevenMetres: summary?.penaltyGiven ? `${summary.penaltyScored ?? 0}/${summary.penaltyGiven}` : null,
    twoMinuteSuspensions: suspensions,
    redCards: players.filter((pl) => pl.redTime).length,
    timeouts: summary?.timeouts?.length ?? 0,
  }
}

export const matchFacts = (fixture: MhaFixture, report: MhaMatchReport) => {
  const homeTeam = report.homeTeam || fixture.homeTeam
  const awayTeam = report.awayTeam || fixture.awayTeam
  const ourSides: Side[] = [
    ...(isOurs(fixture.homeClub) ? (['home'] as const) : []),
    ...(isOurs(fixture.awayClub) ? (['away'] as const) : []),
  ]
  const mvps = Object.values(report.mvpAwards ?? {})
    .filter((m): m is NonNullable<typeof m> => Boolean(m?.name))
    .map((m) => `${m.name} (${m.team})`)

  return {
    // The report's name is sometimes only the category code ("U17B"); the feed's is the full one.
    competition: competitionNameFor(fixture),
    category: MHA_CATEGORY_LABELS[fixture.category] ?? fixture.category,
    date: fixture.date,
    venue: report.venue || fixture.venue,
    home: { team: homeTeam, club: fixture.homeClub },
    away: { team: awayTeam, club: fixture.awayClub },
    /** Which side(s) are La Salle teams. Both for a derby such as Team Haier v HMS. */
    laSalleSides: ourSides,
    finalScore: `${report.homeScore}-${report.awayScore}`,
    halfTime:
      report.halfTimeHome != null && report.halfTimeAway != null
        ? `${report.halfTimeHome}-${report.halfTimeAway}`
        : null,
    flow: scoreFlow(report),
    homeSheet: teamSheet(report, 'home'),
    awaySheet: teamSheet(report, 'away'),
    mvp: mvps,
  }
}

/* ------------------------------------------------------------------ */
/* Writing                                                             */
/* ------------------------------------------------------------------ */

const Summary = z.object({
  title: z.string().describe('Headline, at most 80 characters, e.g. "HMS edge Valletta in a tight derby"'),
  description: z.string().describe('One or two sentence excerpt for news cards, at most 200 characters.'),
  paragraphs: z.array(z.string()).describe('The article body: 3 to 5 short paragraphs of plain text.'),
})

export type WrittenSummary = z.infer<typeof Summary> & { writer: 'gemini' | 'template' }

const SYSTEM_PROMPT = `You write match reports for the news page of La Salle Handball Club in Malta.

Each request gives you the facts of one finished handball match as JSON, taken from the Malta Handball Association's official score sheet. "laSalleSides" says which side is a La Salle team; La Salle fields several teams under sponsor names (for example "HMS", "Team Haier", "La Salle Leapmotor"), and when both sides are La Salle teams it is an in-club derby, so stay even-handed.

Write a short, upbeat but honest report for club members and parents:
- Use only the facts given. Never invent quotes, tactics, injuries, crowd details, weather or anything else not in the data. If something is not in the data, leave it out. You know nothing about other matches, so say nothing about form, streaks, league position, points or upcoming fixtures.
- Lead with the result and what it means in one line, then the story of the match from the half-time score and score flow, then the standout performers (top scorers, MVP), then a brief close.
- Use British English and handball terms (throw-off, 7-metre, two-minute suspension). Write scores as 28–24 with an en dash.
- Refer to La Salle teams by the team name given. Be gracious about the opponents.
- Name players only as top scorers or MVP, never to criticise anyone. Youth teams are children: keep the focus on the team.
- Keep it to 3–5 short paragraphs, roughly 150–250 words in all. No headings, lists, markdown or emoji.`

const geminiClient = () =>
  process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null

const writeWithGemini = async (client: GoogleGenAI, facts: MatchFacts) => {
  const response = await client.models.generateContent({
    model: MODEL,
    contents: JSON.stringify(facts, null, 2),
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: 'application/json',
      responseJsonSchema: z.toJSONSchema(Summary),
      abortSignal: AbortSignal.timeout(90_000),
    },
  })

  const finish = response.candidates?.[0]?.finishReason
  if (finish && finish !== FinishReason.STOP) throw new Error(`Gemini stopped early (${finish})`)
  if (!response.text) throw new Error('Gemini returned no report')
  const parsed = Summary.parse(JSON.parse(response.text))
  if (!parsed.paragraphs.length) throw new Error('Gemini returned an empty report')
  return parsed
}

const dash = (score: string) => score.replace('-', '–')

/** Plain fallback when there is no API key or the model call fails. */
export const writeFromTemplate = (facts: MatchFacts): z.infer<typeof Summary> => {
  const [homeGoals, awayGoals] = facts.finalScore.split('-').map(Number)
  const scoreline = `${Math.max(homeGoals, awayGoals)}–${Math.min(homeGoals, awayGoals)}`
  const winner: Side = homeGoals >= awayGoals ? 'home' : 'away'
  const loser: Side = winner === 'home' ? 'away' : 'home'
  const result =
    homeGoals === awayGoals
      ? `${facts.home.team} and ${facts.away.team} drew ${scoreline}`
      : `${facts[winner].team} beat ${facts[loser].team} ${scoreline}`

  // Lead with the La Salle side when it lost, unless it is an in-club derby.
  const lostOnlySide = facts.laSalleSides.length === 1 && facts.laSalleSides[0] === loser && homeGoals !== awayGoals
  const title = lostOnlySide ? `${facts[loser].team} fall to ${facts[winner].team} ${scoreline}` : result

  const sheet = (side: Side) => (side === 'home' ? facts.homeSheet : facts.awaySheet)
  const scorers = (side: Side) =>
    sheet(side)
      .scorers.slice(0, 3)
      .map((s) => `${s.name} (${s.goals})`)
      .join(', ')

  const paragraphs = [
    `${result} in the ${facts.competition} on ${new Date(`${facts.date}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}.`,
    ...(facts.halfTime ? [`The score at half-time was ${dash(facts.halfTime)}.`] : []),
    [
      scorers('home') && `Top scorers for ${facts.home.team}: ${scorers('home')}.`,
      scorers('away') && `For ${facts.away.team}: ${scorers('away')}.`,
    ]
      .filter(Boolean)
      .join(' '),
    ...(facts.mvp.length ? [`Player of the match: ${facts.mvp.join(', ')}.`] : []),
  ].filter(Boolean)

  return {
    title,
    description: `${facts.competition}: ${facts.home.team} ${dash(facts.finalScore)} ${facts.away.team}.`,
    paragraphs,
  }
}

export const writeSummary = async (facts: MatchFacts, payload?: Payload): Promise<WrittenSummary> => {
  const client = geminiClient()
  if (client) {
    try {
      return { ...(await writeWithGemini(client, facts)), writer: 'gemini' }
    } catch (err) {
      payload?.logger.warn({ msg: 'Match summary: Gemini failed, using template', err })
    }
  }
  return { ...writeFromTemplate(facts), writer: 'template' }
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

const postedMatchIds = async (payload: Payload, matchIds: string[]) => {
  if (!matchIds.length) return new Set<string>()
  const existing = await payload.find({
    collection: 'news',
    where: { mhaMatchId: { in: matchIds } },
    draft: true,
    limit: matchIds.length,
    pagination: false,
    depth: 0,
    overrideAccess: true,
    select: { mhaMatchId: true },
  })
  return new Set(existing.docs.map((d) => d.mhaMatchId).filter((id): id is string => Boolean(id)))
}

/**
 * Finds La Salle matches that finished in the last `lookbackDays` and have no post
 * yet, and writes one for each whose MHA report is out.
 */
export const createMatchSummaryPosts = async (
  payload: Payload,
  { dryRun = false, lookbackDays = DEFAULT_LOOKBACK_DAYS, matchId, deadline, now = new Date() }: Options = {},
): Promise<MatchSummaryResult> => {
  const { fixtures } = await fetchMhaFixtures()
  const since = maltaDate(new Date(now.getTime() - lookbackDays * 86_400_000))
  const today = maltaDate(now)

  const ours = fixtures.filter((f) => isOurs(f.homeClub) || isOurs(f.awayClub))
  const candidates = matchId
    ? ours.filter((f) => f.matchId === matchId)
    : ours.filter((f) => isFinished(f) && f.date >= since && f.date <= today)

  const posted = matchId ? new Set<string>() : await postedMatchIds(payload, candidates.map((f) => f.matchId))
  const todo = candidates.filter((f) => !posted.has(f.matchId)).sort((a, b) => a.date.localeCompare(b.date))

  const result: MatchSummaryResult = { dryRun, remaining: 0, items: [] }
  if (!todo.length) return result

  const categoryId = await matchReportsCategoryId(payload, dryRun)
  const imageId = await fallbackImageId(payload)
  const publish = process.env.MATCH_SUMMARY_AUTOPUBLISH === 'true'

  for (const [index, fixture] of todo.entries()) {
    if (index > 0 && deadline && Date.now() > deadline) {
      result.remaining = todo.length - index
      break
    }

    const base = { matchId: fixture.matchId, game: `${fixture.homeTeam} v ${fixture.awayTeam}`, date: fixture.date }
    try {
      const report = await fetchMhaMatchReport(fixture.matchId)
      if (!report) {
        result.items.push({ ...base, action: 'skipped', reason: 'MHA match report not published yet' })
        continue
      }

      const facts = matchFacts(fixture, report)
      const summary = await writeSummary(facts, payload)

      if (dryRun) {
        result.items.push({ ...base, action: 'created', title: summary.title, writer: summary.writer, reason: summary.paragraphs.join('\n\n') })
        continue
      }
      if (!categoryId) throw new Error('No Match Reports news category')

      // A draft may be saved without its required fields; a published post needs the image.
      const status = publish && imageId ? 'published' : 'draft'
      const doc = await payload.create({
        collection: 'news',
        draft: status === 'draft',
        overrideAccess: true,
        data: {
          title: summary.title,
          slug: `${slugify(summary.title)}-${fixture.date}`,
          category: categoryId,
          publishedAt: new Date(`${fixture.date}T12:00:00Z`).toISOString(),
          description: summary.description,
          // Drafts skip required-field validation, so a missing fallback image is fine there.
          featuredImage: imageId as string,
          tags: ['Match Report', facts.category],
          content: richText(...summary.paragraphs.map(p)),
          mhaMatchId: fixture.matchId,
          _status: status,
        },
      })

      result.items.push({ ...base, action: 'created', title: summary.title, writer: summary.writer, newsId: doc.id })
    } catch (err) {
      payload.logger.error({ msg: `Match summary for ${fixture.matchId} failed`, err })
      result.items.push({ ...base, action: 'error', reason: errorMessage(err) })
    }
  }

  return result
}
