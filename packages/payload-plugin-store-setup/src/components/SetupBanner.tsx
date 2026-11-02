import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createLocalReq, type Payload, type TypedUser } from 'payload'
import { canManageStore, computeTasks, countRecords, environment, readStoreSettings, resolvedOptions } from '../server'
import { WIZARDS } from '../wizards'
import './setup.css'

/**
 * Dashboard card with setup progress, like WooCommerce's home-screen task list. Sends staff
 * to the wizard once on first run (option `firstRunRedirect`).
 */
export async function SetupBanner({ payload, user }: { payload: Payload; user?: TypedUser | null }) {
  if (!user) return null
  const opts = resolvedOptions(payload)
  const req = await createLocalReq({ user }, payload)
  if (!(await canManageStore(req, opts))) return null

  const settings = await readStoreSettings(req, opts, 0)
  const admin = payload.config.routes.admin
  if (opts.firstRunRedirect !== false && !settings.setup?.firstRunDone && !settings.profile?.completedAt) redirect(`${admin}/store-setup/store-profile`)
  if (settings.setup?.taskListHidden) return null

  const tasks = computeTasks(settings, await countRecords(payload, opts), environment(payload))
  const essential = WIZARDS.filter((w) => w.group === 'essential' && tasks.find((t) => t.id === w.id)?.visible)
  const done = essential.filter((w) => tasks.find((t) => t.id === w.id)?.complete)
  if (done.length === essential.length) return null
  const next = essential.find((w) => {
    const t = tasks.find((x) => x.id === w.id)
    return !t?.complete && !t?.skipped
  })
  const pct = Math.round((done.length / essential.length) * 100)

  return (
    <div className="ss-banner">
      <div className="ss-banner__text">
        <span className="ss-eyebrow">Store setup · {done.length} of {essential.length} done</span>
        <strong>{settings.profile?.storeName ? `Finish setting up ${settings.profile.storeName}` : 'Finish setting up your store'}</strong>
        {next && <span>Next: {next.title}</span>}
      </div>
      <div className="ss-banner__bar" aria-hidden>
        <span style={{ width: `${pct}%` }} />
      </div>
      <Link className="ss-btn ss-btn--primary" href={next ? `${admin}/store-setup/${next.id}` : `${admin}/store-setup`}>
        {done.length ? 'Continue setup' : 'Start setup'}
      </Link>
    </div>
  )
}
