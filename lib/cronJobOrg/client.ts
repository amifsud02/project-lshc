/**
 * Client for the cron-job.org REST API (https://docs.cron-job.org/rest-api.html),
 * used to call the site back at a set time, e.g. an hour after a throw-off.
 *
 * cron-job.org has no one-off jobs: a schedule of one month, day, hour and minute
 * repeats every year. Each job therefore carries an `expiresAt` shortly after its
 * run, so a job that is never deleted still only fires once.
 *
 * Limits on the free plan: 100 API requests a day, and job creation at 1 a second
 * and 5 a minute. Callers keep to those; a 429 surfaces as a `CronJobOrgError`.
 */

const API = 'https://api.cron-job.org'

/** How long after its run a job stays valid, in case cron-job.org runs it a little late. */
const EXPIRY_GRACE_MS = 30 * 60_000

const REQUEST_METHOD_POST = 1

export class CronJobOrgError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}

export const isCronJobOrgConfigured = () => Boolean(process.env.CRONJOB_ORG_API_KEY)

const request = async <T>(method: string, path: string, body?: unknown): Promise<T> => {
  const key = process.env.CRONJOB_ORG_API_KEY
  if (!key) throw new CronJobOrgError('CRONJOB_ORG_API_KEY is not set', 0)

  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new CronJobOrgError(`cron-job.org ${method} ${path} returned HTTP ${res.status} ${text}`.trim(), res.status)
  }
  return (await res.json().catch(() => ({}))) as T
}

const pad = (n: number, width = 2) => String(n).padStart(width, '0')

/** A schedule that fires once, at `runAt` (to the minute, UTC). */
const onceAt = (runAt: Date) => {
  const expires = new Date(runAt.getTime() + EXPIRY_GRACE_MS)
  return {
    timezone: 'UTC',
    expiresAt: Number(
      `${expires.getUTCFullYear()}${pad(expires.getUTCMonth() + 1)}${pad(expires.getUTCDate())}` +
        `${pad(expires.getUTCHours())}${pad(expires.getUTCMinutes())}${pad(expires.getUTCSeconds())}`,
    ),
    months: [runAt.getUTCMonth() + 1],
    mdays: [runAt.getUTCDate()],
    hours: [runAt.getUTCHours()],
    minutes: [runAt.getUTCMinutes()],
    wdays: [-1],
  }
}

export type OneOffJob = {
  title: string
  url: string
  runAt: Date
  /** Sent as the JSON body of the POST. */
  body: unknown
  headers?: Record<string, string>
}

const jobFields = ({ title, url, runAt, body, headers }: OneOffJob) => ({
  title,
  url,
  enabled: true,
  saveResponses: true,
  requestTimeout: 60,
  requestMethod: REQUEST_METHOD_POST,
  schedule: onceAt(runAt),
  extendedData: {
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  },
})

/** Creates a job that POSTs `body` to `url` once, at `runAt`. Resolves to its job id. */
export const createOneOffJob = async (job: OneOffJob): Promise<number> => {
  const { jobId } = await request<{ jobId: number }>('PUT', '/jobs', { job: jobFields(job) })
  return jobId
}

/** Moves an existing job to a new time and body. Cheaper than delete + create, and not limited to 5 a minute. */
export const rescheduleJob = async (jobId: number, job: OneOffJob): Promise<void> => {
  await request('PATCH', `/jobs/${jobId}`, { job: jobFields(job) })
}

/** Deletes a job. One that is already gone counts as deleted. */
export const deleteJob = async (jobId: number): Promise<void> => {
  try {
    await request('DELETE', `/jobs/${jobId}`)
  } catch (err) {
    if (err instanceof CronJobOrgError && err.status === 404) return
    throw err
  }
}
