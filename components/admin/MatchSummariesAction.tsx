'use client'

import { Button, toast, useConfig, useSelection } from '@payloadcms/ui'
import { useState } from 'react'

import type { MatchSummaryResult, RoundUpItem } from '@/lib/news/matchSummaries'

const STATUS: Record<RoundUpItem['action'], { label: (dryRun: boolean) => string; colour: string }> = {
  created: { label: (dryRun) => (dryRun ? 'preview' : 'written'), colour: 'var(--theme-success-500)' },
  waiting: { label: () => 'waiting', colour: 'var(--theme-elevation-500)' },
  error: { label: () => 'failed', colour: 'var(--theme-error-500)' },
}

const muted = { color: 'var(--theme-elevation-500)' }

/**
 * Sits above the Fixtures list. Tick finished matches, then "Write round-ups" drafts
 * one news post per week covering them, written from their MHA match reports with the
 * spotlight on the La Salle teams (lib/news/matchSummaries.ts). "Preview" shows the
 * text first. The nightly job does the same for each complete week by itself.
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
  const [result, setResult] = useState<MatchSummaryResult | null>(null)

  const count = selectedIDs.length

  const run = async (preview: boolean) => {
    setBusy(preview ? 'preview' : 'write')
    setResult(null)
    try {
      const res = await fetch(`${serverURL}${api}/match-summaries`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fixtureIds: [...selectedIDs], dryRun: preview }),
      })
      const data = (await res.json().catch(() => null)) as (MatchSummaryResult & { error?: string }) | null
      if (!res.ok || !data) throw new Error(data?.error ?? `HTTP ${res.status}`)
      setResult(data)

      const written = data.roundUps.filter((r) => r.action === 'created').length
      const failed = data.roundUps.filter((r) => r.action === 'error').length
      const message = [
        preview ? `${written} round-up${written === 1 ? '' : 's'} ready to write` : `${written} draft round-up${written === 1 ? '' : 's'} written`,
        data.skipped.length ? `${data.skipped.length} match${data.skipped.length === 1 ? '' : 'es'} skipped` : '',
        failed ? `${failed} failed` : '',
        data.remaining ? `${data.remaining} week${data.remaining === 1 ? '' : 's'} left: run it again` : '',
      ]
        .filter(Boolean)
        .join(', ')
      if (failed) toast.error(message)
      else if (written) toast.success(message)
      else toast.info(`${message}. See the list for why.`)
    } catch (err) {
      toast.error(`Round-up failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setBusy(null)
    }
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
          <strong>Match round-ups</strong>
          <p style={{ color: 'var(--theme-elevation-600)', margin: 0 }}>
            {count
              ? `${count} fixture${count === 1 ? '' : 's'} selected. Finished matches are grouped into one draft round-up per week, written from their MHA reports.`
              : 'Each week the La Salle results are written up as one draft round-up. Tick finished matches below to write one straight away.'}
          </p>
        </div>
        <Button buttonStyle="secondary" disabled={!count || busy !== null} margin={false} onClick={() => run(true)}>
          {busy === 'preview' ? 'Previewing…' : 'Preview'}
        </Button>
        <Button disabled={!count || busy !== null} margin={false} onClick={() => run(false)}>
          {busy === 'write' ? 'Writing…' : `Write round-ups${count ? ` (${count})` : ''}`}
        </Button>
      </div>

      {result && (result.roundUps.length || result.skipped.length) ? (
        <ul style={{ listStyle: 'none', margin: '0.75rem 0 0', maxHeight: '28rem', overflowY: 'auto', padding: 0 }}>
          {result.roundUps.map((r) => (
            <li key={r.week} style={{ padding: '0.35rem 0' }}>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <span style={{ color: STATUS[r.action].colour, minWidth: '5rem' }}>{STATUS[r.action].label(result.dryRun)}</span>
                <span>
                  Round-up, {r.label}
                  {r.title ? <> — <strong>{r.title}</strong></> : null}
                  {r.reason ? <span style={muted}> — {r.reason}</span> : null}
                  {r.newsId ? (
                    <>
                      {' '}
                      <a href={postLink(r.newsId)}>Open post</a>
                    </>
                  ) : null}
                  <span style={{ ...muted, display: 'block' }}>
                    {r.matches
                      .map((m) => `${m.game} · ${m.date}${m.reportAvailable ? '' : ' (score only)'}`)
                      .join('; ')}
                  </span>
                </span>
              </div>
              {r.paragraphs?.length ? (
                <details style={{ margin: '0.25rem 0 0 5.75rem' }}>
                  <summary style={{ cursor: 'pointer' }}>Read the text</summary>
                  {r.description ? <p style={{ fontStyle: 'italic' }}>{r.description}</p> : null}
                  {r.paragraphs.map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </details>
              ) : null}
            </li>
          ))}
          {result.skipped.map((m) => (
            <li key={m.matchId} style={{ display: 'flex', gap: '0.75rem', padding: '0.35rem 0' }}>
              <span style={{ ...muted, minWidth: '5rem' }}>skipped</span>
              <span>
                {m.game}
                {m.date ? <span style={muted}> · {m.date}</span> : null}
                <span style={muted}> — {m.reason}</span>
                {m.newsId ? (
                  <>
                    {' '}
                    <a href={postLink(m.newsId)}>Open existing post</a>
                  </>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
