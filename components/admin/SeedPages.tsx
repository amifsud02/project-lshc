'use client'

import { Button, toast, useConfig } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import type { SeedPageResult } from '@/lib/seed/pages'

/**
 * Sits above the Pages list. Writes the starter content as drafts so each page
 * can be reviewed and published individually — nothing goes live from here.
 */
export const SeedPages = () => {
  const {
    config: {
      routes: { admin, api },
      serverURL,
    },
  } = useConfig()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [results, setResults] = useState<SeedPageResult[] | null>(null)

  const run = async () => {
    if (!window.confirm('Write the starter content for each page as a draft? Live pages are not changed.')) return
    setBusy(true)
    try {
      const res = await fetch(`${serverURL}${api}/pages/seed`, { method: 'POST', credentials: 'include' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`)
      setResults(data.results)
      const failed = (data.results as SeedPageResult[]).filter((r) => r.action === 'error').length
      if (failed) toast.error(`${failed} page(s) could not be seeded`)
      else toast.success('Draft content written — review and publish each page')
      router.refresh()
    } catch (err) {
      toast.error(`Seeding failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setBusy(false)
    }
  }

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
          <strong>Starter content</strong>
          <p style={{ color: 'var(--theme-elevation-600)', margin: 0 }}>
            Saves the default content for the site’s pages as drafts. Published pages stay as they are until you publish
            the draft.
          </p>
        </div>
        <Button disabled={busy} margin={false} onClick={run}>
          {busy ? 'Seeding…' : 'Seed pages'}
        </Button>
      </div>

      {results ? (
        <ul style={{ listStyle: 'none', margin: 'var(--base) 0 0', padding: 0 }}>
          {results.map((r) => (
            <li key={r.slug} style={{ padding: '0.15rem 0' }}>
              <span
                style={{
                  color: r.action === 'error' ? 'var(--theme-error-500)' : 'var(--theme-success-500)',
                  display: 'inline-block',
                  minWidth: '5.5rem',
                }}
              >
                {r.action === 'created' ? 'new draft' : r.action === 'drafted' ? 'draft saved' : 'failed'}
              </span>
              <a href={`${admin}/collections/pages?where[slug][equals]=${encodeURIComponent(r.slug)}`}>{r.title}</a>
              <span style={{ color: 'var(--theme-elevation-500)' }}> /{r.slug === 'home' ? '' : r.slug}</span>
              {r.detail ? <span style={{ color: 'var(--theme-error-500)' }}> — {r.detail}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
