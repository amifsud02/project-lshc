'use client'

import { Button, toast, useConfig } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import type { SyncAction, SyncResult } from '@/lib/mha/syncFixtures'

const ACTION_COLOURS: Record<SyncAction, string> = {
  created: 'var(--theme-success-500)',
  updated: 'var(--theme-warning-500)',
  unchanged: 'var(--theme-elevation-500)',
  skipped: 'var(--theme-elevation-500)',
  error: 'var(--theme-error-500)',
}

/**
 * Sits above the Fixtures list. "Preview" asks the server what a sync would do
 * without writing; "Sync now" applies it and refreshes the list.
 */
export const MhaFixturesSync = () => {
  const {
    config: {
      routes: { api },
      serverURL,
    },
  } = useConfig()
  const router = useRouter()
  const [busy, setBusy] = useState<'preview' | 'sync' | null>(null)
  const [result, setResult] = useState<SyncResult | null>(null)
  const [showUnchanged, setShowUnchanged] = useState(false)
  const [refreshLineups, setRefreshLineups] = useState(false)

  const run = async (dryRun: boolean) => {
    setBusy(dryRun ? 'preview' : 'sync')
    try {
      const res = await fetch(`${serverURL}${api}/fixtures/sync-mha`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun, refreshLineups }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`)

      setResult(data)
      const { created, updated, error } = (data as SyncResult).counts
      const verb = dryRun ? 'would be' : ''
      toast.success(`${created} ${verb} created, ${updated} ${verb} updated${error ? `, ${error} failed` : ''}`)
      if (!dryRun) router.refresh()
    } catch (err) {
      toast.error(`MHA sync failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setBusy(null)
    }
  }

  const items = result?.items.filter((i) => showUnchanged || i.action !== 'unchanged') ?? []

  return (
    <div
      style={{
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: 'var(--style-radius-m)',
        marginBottom: 'var(--base)',
        padding: 'var(--base)',
      }}
    >
      <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 'calc(var(--base) / 2)' }}>
        <div style={{ flex: '1 1 16rem' }}>
          <strong>Malta Handball Association</strong>
          <p style={{ color: 'var(--theme-elevation-600)', margin: 0 }}>
            Import La Salle fixtures, results, line-ups and player stats from maltahandball.com.
          </p>
          <label style={{ display: 'inline-flex', gap: '0.4rem', marginTop: '0.25rem' }}>
            <input checked={refreshLineups} onChange={(e) => setRefreshLineups(e.target.checked)} type="checkbox" />
            Re-read every finished match&apos;s line-up
          </label>
        </div>
        <Button buttonStyle="secondary" disabled={busy !== null} margin={false} onClick={() => run(true)}>
          {busy === 'preview' ? 'Checking…' : 'Preview'}
        </Button>
        <Button disabled={busy !== null} margin={false} onClick={() => run(false)}>
          {busy === 'sync' ? 'Syncing…' : 'Sync now'}
        </Button>
      </div>

      {result ? (
        <div style={{ marginTop: 'var(--base)' }}>
          <p style={{ margin: 0 }}>
            {result.dryRun ? <em>Preview — nothing saved. </em> : null}
            {result.considered} La Salle fixtures of {result.fetched} on the feed:{' '}
            {(Object.keys(result.counts) as SyncAction[])
              .filter((a) => result.counts[a] > 0)
              .map((a) => `${result.counts[a]} ${a}`)
              .join(', ')}
            .
          </p>
          <p style={{ margin: '0.25rem 0 0' }}>
            Line-ups: {result.lineups.saved} {result.dryRun ? 'to save' : 'saved'}
            {result.lineups.unchanged ? `, ${result.lineups.unchanged} unchanged` : ''}
            {result.lineups.pending ? `, ${result.lineups.pending} awaiting MHA report` : ''}
            {result.lineups.failed ? `, ${result.lineups.failed} failed` : ''}.{' '}
            {result.playerStats.season
              ? `Player stats (${result.playerStats.season}): ${result.playerStats.updated} ${
                  result.dryRun ? 'to update' : 'updated'
                }, ${result.playerStats.unchanged} unchanged${
                  result.playerStats.failed ? `, ${result.playerStats.failed} failed` : ''
                }.`
              : null}
          </p>

          {[
            ['New teams', result.teamsCreated],
            ['Teams linked', result.teamsLinked],
            ['New competitions', result.competitionsCreated],
            ['New players', result.playersCreated],
            ['Players linked', result.playersLinked],
            ['Warnings', result.warnings],
          ].map(([title, list]) =>
            (list as string[]).length ? (
              <p key={title as string} style={{ color: 'var(--theme-elevation-600)', margin: '0.25rem 0 0' }}>
                {title}: {(list as string[]).join(', ')}
              </p>
            ) : null,
          )}

          <label style={{ display: 'inline-flex', gap: '0.4rem', marginTop: '0.5rem' }}>
            <input checked={showUnchanged} onChange={(e) => setShowUnchanged(e.target.checked)} type="checkbox" />
            Show unchanged
          </label>

          {items.length ? (
            <ul style={{ listStyle: 'none', margin: '0.5rem 0 0', maxHeight: '18rem', overflowY: 'auto', padding: 0 }}>
              {items.map((item) => (
                <li key={item.fixtureCode} style={{ display: 'flex', gap: '0.75rem', padding: '0.15rem 0' }}>
                  <span style={{ color: ACTION_COLOURS[item.action], minWidth: '5.5rem' }}>{item.action}</span>
                  <span>
                    {item.label}
                    {item.detail ? (
                      <span style={{ color: 'var(--theme-elevation-500)' }}> — {item.detail}</span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
