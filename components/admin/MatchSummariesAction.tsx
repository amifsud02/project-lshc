'use client'

import { Button, toast, useConfig, useSelection } from '@payloadcms/ui'
import { useState } from 'react'

import type { MatchSummaryItem, MatchSummaryResult } from '@/lib/news/matchSummaries'

type Row = MatchSummaryItem & { fixtureId: string | number }

const STATUS: Record<MatchSummaryItem['action'], { label: (dryRun: boolean) => string; colour: string }> = {
  created: { label: (dryRun) => (dryRun ? 'preview' : 'written'), colour: 'var(--theme-success-500)' },
  skipped: { label: () => 'skipped', colour: 'var(--theme-elevation-500)' },
  error: { label: () => 'failed', colour: 'var(--theme-error-500)' },
}

/**
 * Sits above the Fixtures list. Tick finished matches, then "Write summaries" drafts
 * a news post for each from its MHA match report (lib/news/matchSummaries.ts), one
 * request per fixture so progress shows as it goes. "Preview" shows the text first.
 */
export const MatchSummariesAction = () => {
  const {
    config: {
      routes: { admin, api },
      serverURL,
    },
  } = useConfig()
  const { selectedIDs } = useSelection()
  const [busy, setBusy] = useState<'preview' | 'write' | null>(null)
  const [progress, setProgress] = useState<string | null>(null)
  const [rows, setRows] = useState<Row[] | null>(null)
  const [dryRun, setDryRun] = useState(false)

  const count = selectedIDs.length

  const writeOne = async (fixtureId: string | number, preview: boolean): Promise<Row[]> => {
    try {
      const res = await fetch(`${serverURL}${api}/match-summaries`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fixtureId, dryRun: preview }),
      })
      const data = (await res.json().catch(() => null)) as (MatchSummaryResult & { error?: string }) | null
      if (!res.ok || !data) throw new Error(data?.error ?? `HTTP ${res.status}`)
      return data.items.map((item) => ({ ...item, fixtureId }))
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err)
      return [{ fixtureId, matchId: String(fixtureId), game: `Fixture ${fixtureId}`, date: '', action: 'error', reason }]
    }
  }

  const run = async (preview: boolean) => {
    const ids = [...selectedIDs]
    setBusy(preview ? 'preview' : 'write')
    setDryRun(preview)
    setRows([])
    const done: Row[] = []
    for (const [index, id] of ids.entries()) {
      setProgress(`${preview ? 'Previewing' : 'Writing'} ${index + 1} of ${ids.length}…`)
      done.push(...(await writeOne(id, preview)))
      setRows([...done])
    }
    setBusy(null)
    setProgress(null)

    const tally = (action: MatchSummaryItem['action']) => done.filter((r) => r.action === action).length
    const [written, skipped, failed] = [tally('created'), tally('skipped'), tally('error')]
    const message = [
      preview ? `${written} ready to write` : `${written} draft post${written === 1 ? '' : 's'} written`,
      skipped ? `${skipped} skipped` : '',
      failed ? `${failed} failed` : '',
    ]
      .filter(Boolean)
      .join(', ')
    if (failed) toast.error(message)
    else if (written) toast.success(message)
    else toast.info(`${message}. See the list for why.`)
  }

  const postLink = (newsId: string | number) => `${serverURL}${admin}/collections/news/${newsId}`

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
          <strong>Match summaries</strong>
          <p style={{ color: 'var(--theme-elevation-600)', margin: 0 }}>
            {count
              ? `${count} fixture${count === 1 ? '' : 's'} selected. Each finished match gets a draft news post written from its MHA report.`
              : 'Tick finished matches in the list below to write a draft news post for each from its MHA report.'}
          </p>
        </div>
        <Button buttonStyle="secondary" disabled={!count || busy !== null} margin={false} onClick={() => run(true)}>
          {busy === 'preview' ? 'Previewing…' : 'Preview'}
        </Button>
        <Button disabled={!count || busy !== null} margin={false} onClick={() => run(false)}>
          {busy === 'write' ? 'Writing…' : `Write summaries${count ? ` (${count})` : ''}`}
        </Button>
      </div>

      {progress ? <p style={{ color: 'var(--theme-elevation-600)', margin: '0.5rem 0 0' }}>{progress}</p> : null}

      {rows?.length ? (
        <ul style={{ listStyle: 'none', margin: '0.75rem 0 0', maxHeight: '28rem', overflowY: 'auto', padding: 0 }}>
          {rows.map((row) => (
            <li key={`${row.fixtureId}-${row.matchId}`} style={{ padding: '0.35rem 0' }}>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <span style={{ color: STATUS[row.action].colour, minWidth: '5rem' }}>
                  {STATUS[row.action].label(dryRun)}
                </span>
                <span>
                  {row.game}
                  {row.date ? <span style={{ color: 'var(--theme-elevation-500)' }}> · {row.date}</span> : null}
                  {row.title ? <> — <strong>{row.title}</strong></> : null}
                  {row.reason ? <span style={{ color: 'var(--theme-elevation-500)' }}> — {row.reason}</span> : null}
                  {row.newsId ? (
                    <>
                      {' '}
                      <a href={postLink(row.newsId)}>{row.action === 'skipped' ? 'Open existing post' : 'Open post'}</a>
                    </>
                  ) : null}
                </span>
              </div>
              {row.paragraphs?.length ? (
                <details style={{ margin: '0.25rem 0 0 5.75rem' }}>
                  <summary style={{ cursor: 'pointer' }}>Read the text</summary>
                  {row.description ? <p style={{ fontStyle: 'italic' }}>{row.description}</p> : null}
                  {row.paragraphs.map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </details>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
