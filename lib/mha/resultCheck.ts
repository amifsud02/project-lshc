import type { Payload } from 'payload'

import type { Fixture } from '@/payload-types'
import {
  createOneOffJob,
  CronJobOrgError,
  deleteJob,
  isCronJobOrgConfigured,
  rescheduleJob,
} from '@/lib/cronJobOrg/client'
import { absoluteUrl } from '@/lib/seo/site'

import { runMhaSyncStage } from './syncFixtures'

/**
 * Result checks: a cron-job.org job per La Salle fixture that calls
 * /api/cron/fixture-result an hour after throw-off. The endpoint syncs that one
 * match from MHA; while MHA has not finished it (or its match report is not out
 * yet) the same job is moved 15 minutes on, up to five times.
 *
 * Jobs are created a couple of days ahead by the `scheduleResultChecks` task rather
 * than for the whole season at once: cron-job.org allows 100 API requests a day and
 * 5 new jobs a minute, and a fixture can need up to seven requests (create, five
 * moves, delete). The fixture's `resultCheck` group records where its job stands.
 */

export const RESULT_CHECK_PATH = '/api/cron/fixture-result'

export const FIRST_CHECK_DELAY_MS = 60 * 60_000
export const RETRY_DELAY_MS = 15 * 60_000
export const MAX_RETRIES = 5

/** How far ahead jobs are created. */
const HORIZON_MS = 48 * 60 * 60_000
/** A fixture whose throw-off is this far past without a job still gets one, e.g. after downtime. */
const LOOKBACK_MS = 6 * 60 * 60_000
/** cron-job.org runs to the minute; never schedule closer than this. */
const MIN_LEAD_MS = 2 * 60_000
/** cron-job.org allows 5 new jobs a minute; the rest wait for the next run of the task. */
const MAX_CREATES_PER_RUN = 5
/** Spacing between API calls, inside the 1-a-second limit on creating jobs. */
const CALL_SPACING_MS = 1_100

export type ResultCheckState = NonNullable<NonNullable<Fixture['resultCheck']>['state']>

export type ResultCheckBody = { fixtureId: string; retryCount: number }

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const errorMessage = (err: unknown) => (err instanceof Error ? err.message : String(err))

const sameInstant = (a: string | null | undefined, b: string | null | undefined) =>
  Boolean(a && b) && new Date(a!).getTime() === new Date(b!).getTime()

const callbackHeaders = () => ({ Authorization: `Bearer ${process.env.CRON_SECRET}` })

const jobFor = (fixtureCode: string, runAt: Date, retryCount: number) => ({
  title: `Result check ${fixtureCode}${retryCount ? ` (retry ${retryCount})` : ''}`,
  url: absoluteUrl(RESULT_CHECK_PATH),
  runAt,
  body: { fixtureId: fixtureCode, retryCount } satisfies ResultCheckBody,
  headers: callbackHeaders(),
})

const firstRunFor = (startDate: string, now: number) =>
  new Date(Math.max(new Date(startDate).getTime() + FIRST_CHECK_DELAY_MS, now + MIN_LEAD_MS))

type FixtureRef = Pick<Fixture, 'id' | 'fixtureCode' | 'startDate' | 'resultCheck'>

/**
 * Points a fixture's job at its first check, an hour after `startDate`: moves the
 * job it already has, or creates one. Returns whether a job was created.
 */
const scheduleFirstCheck = async (payload: Payload, fixture: FixtureRef, now: number): Promise<boolean> => {
  const runAt = firstRunFor(fixture.startDate, now)
  const job = jobFor(fixture.fixtureCode, runAt, 0)

  let jobId = fixture.resultCheck?.jobId ?? null
  let created = false
  if (jobId) {
    try {
      await rescheduleJob(jobId, job)
    } catch (err) {
      if (!(err instanceof CronJobOrgError && err.status === 404)) throw err
      jobId = null
    }
  }
  if (!jobId) {
    jobId = await createOneOffJob(job)
    created = true
  }

  await payload.update({
    collection: 'fixtures',
    id: fixture.id,
    data: {
      resultCheck: {
        jobId,
        scheduledFor: fixture.startDate,
        nextRunAt: runAt.toISOString(),
        retryCount: 0,
        state: 'scheduled',
        lastError: null,
      },
    },
  })
  return created
}

export type ScheduleResult = { scheduled: string[]; deferred: number; errors: string[] }

/**
 * Gives each Scheduled fixture throwing off in the next two days a result check,
 * and moves the check of any fixture whose throw-off has changed since. Fixtures
 * already scheduled for their current throw-off are left alone, so running this
 * often costs no API requests.
 */
export const scheduleResultChecks = async (payload: Payload, now = Date.now()): Promise<ScheduleResult> => {
  const result: ScheduleResult = { scheduled: [], deferred: 0, errors: [] }
  if (!isCronJobOrgConfigured() || !process.env.CRON_SECRET) {
    result.errors.push('CRONJOB_ORG_API_KEY and CRON_SECRET must both be set')
    return result
  }

  const { docs } = await payload.find({
    collection: 'fixtures',
    where: {
      and: [
        { status: { equals: 'Scheduled' } },
        { startDate: { greater_than_equal: new Date(now - LOOKBACK_MS).toISOString() } },
        { startDate: { less_than_equal: new Date(now + HORIZON_MS).toISOString() } },
      ],
    },
    pagination: false,
    depth: 0,
    sort: 'startDate',
    select: { fixtureCode: true, startDate: true, resultCheck: true },
  })

  const due = docs.filter((f) => !sameInstant(f.resultCheck?.scheduledFor, f.startDate))

  let creates = 0
  for (const [i, fixture] of due.entries()) {
    if (creates >= MAX_CREATES_PER_RUN && !fixture.resultCheck?.jobId) {
      result.deferred++
      continue
    }
    if (i > 0) await sleep(CALL_SPACING_MS)
    try {
      if (await scheduleFirstCheck(payload, fixture, now)) creates++
      result.scheduled.push(fixture.fixtureCode)
    } catch (err) {
      payload.logger.error({ msg: `Result check scheduling failed for ${fixture.fixtureCode}`, err })
      result.errors.push(`${fixture.fixtureCode}: ${errorMessage(err)}`)
      // Out of requests for today or this minute: the next run picks the rest up.
      if (err instanceof CronJobOrgError && err.status === 429) break
    }
  }
  return result
}

export type CheckResult = {
  fixtureId: string
  retryCount: number
  outcome: 'done' | 'retrying' | 'rescheduled' | 'gave-up' | 'stopped' | 'unknown-fixture'
  status?: Fixture['status']
  nextRunAt?: string
  error?: string
}

/**
 * Runs one result check: syncs the fixture and its line-ups from MHA, then
 * - finishes when MHA has the match finished and its line-ups are stored,
 * - stops when the match was cancelled or postponed,
 * - moves the check to the new throw-off when MHA changed the date,
 * - otherwise moves the job 15 minutes on, until `MAX_RETRIES` is used up.
 */
export const checkFixtureResult = async (
  payload: Payload,
  { fixtureId, retryCount }: ResultCheckBody,
  now = Date.now(),
): Promise<CheckResult> => {
  const result: CheckResult = { fixtureId, retryCount, outcome: 'retrying' }

  let lineupStored = false
  try {
    await runMhaSyncStage(payload, { stage: 'fixtures', fixtureCodes: [fixtureId] })
    const lineups = await runMhaSyncStage(payload, { stage: 'lineups', fixtureCodes: [fixtureId] })
    lineupStored = lineups.lineups.saved + lineups.lineups.unchanged > 0
  } catch (err) {
    payload.logger.error({ msg: `Result check sync failed for ${fixtureId}`, err })
    result.error = errorMessage(err)
  }

  const { docs } = await payload.find({
    collection: 'fixtures',
    where: { fixtureCode: { equals: fixtureId } },
    limit: 1,
    depth: 0,
    select: { fixtureCode: true, startDate: true, status: true, resultCheck: true },
  })
  const fixture = docs[0]
  if (!fixture) return { ...result, outcome: 'unknown-fixture' }

  result.status = fixture.status
  const jobId = fixture.resultCheck?.jobId ?? null
  const lastError = result.error ?? null

  const finish = async (state: ResultCheckState, outcome: CheckResult['outcome']) => {
    if (jobId) {
      try {
        await deleteJob(jobId)
      } catch (err) {
        // The job expires on its own; a stray one is harmless.
        payload.logger.warn({ msg: `Could not delete cron-job.org job ${jobId}`, err })
      }
    }
    await payload.update({
      collection: 'fixtures',
      id: fixture.id,
      data: {
        resultCheck: {
          ...fixture.resultCheck,
          jobId: null,
          nextRunAt: null,
          retryCount,
          state,
          lastCheckedAt: new Date(now).toISOString(),
          lastError,
        },
      },
    })
    return { ...result, outcome }
  }

  if (fixture.status === 'Finished' && lineupStored) return finish('done', 'done')
  if (fixture.status === 'Cancelled' || fixture.status === 'Postponed') return finish('stopped', 'stopped')

  // MHA moved the match: start over from the new throw-off.
  if (
    fixture.status === 'Scheduled' &&
    !sameInstant(fixture.resultCheck?.scheduledFor, fixture.startDate) &&
    new Date(fixture.startDate).getTime() + FIRST_CHECK_DELAY_MS > now
  ) {
    await scheduleFirstCheck(payload, fixture, now)
    return { ...result, outcome: 'rescheduled' }
  }

  if (retryCount >= MAX_RETRIES || !jobId) return finish('gave-up', 'gave-up')

  const next = retryCount + 1
  const runAt = new Date(now + RETRY_DELAY_MS)
  await rescheduleJob(jobId, jobFor(fixtureId, runAt, next))
  await payload.update({
    collection: 'fixtures',
    id: fixture.id,
    data: {
      resultCheck: {
        ...fixture.resultCheck,
        nextRunAt: runAt.toISOString(),
        retryCount: next,
        state: 'retrying',
        lastCheckedAt: new Date(now).toISOString(),
        lastError,
      },
    },
  })
  return { ...result, nextRunAt: runAt.toISOString() }
}
