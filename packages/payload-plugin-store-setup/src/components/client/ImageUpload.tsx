'use client'

import { useState } from 'react'
import { Button, TextInput } from './controls'
import type { StepContext } from './engine'

type Media = { id: string | number; url?: string; filename?: string }

/**
 * Uploads to the configured uploads collection through Payload's REST API and stores the
 * document (the server turns it back into an id on save). Without an uploads collection
 * the field is a plain image URL.
 */
export function ImageUpload({ ctx, path }: { ctx: StepContext; path: string }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const value = ctx.get(path) as Media | string | null | undefined
  const uploads = ctx.state.uploadsCollection
  if (!uploads) return <TextInput type="url" value={typeof value === 'string' ? value : ''} placeholder="https://…" onChange={(v) => ctx.set(path, v)} />

  const media = value && typeof value === 'object' ? value : null
  return (
    <div className="ss-upload">
      {media?.url && <img src={media.url} alt="" className="ss-upload__img" />}
      <label className="ss-btn ss-btn--secondary">
        {busy ? 'Uploading…' : media ? 'Replace image' : 'Upload image'}
        <input
          type="file"
          accept="image/*"
          hidden
          disabled={busy}
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (!file) return
            setBusy(true)
            setError(null)
            try {
              const body = new FormData()
              body.append('file', file)
              body.append('_payload', JSON.stringify({ alt: ctx.get('profile.storeName') || file.name }))
              const res = await fetch(`${ctx.state.apiRoute}/${uploads}`, { method: 'POST', body, credentials: 'include' })
              const json = await res.json()
              if (!res.ok) throw new Error(json.errors?.[0]?.message ?? 'Upload failed')
              ctx.set(path, json.doc)
            } catch (err) {
              setError(err instanceof Error ? err.message : String(err))
            } finally {
              setBusy(false)
            }
          }}
        />
      </label>
      {media && (
        <Button kind="ghost" onClick={() => ctx.set(path, null)}>
          Remove
        </Button>
      )}
      {error && <span className="ss-field__help ss-error">{error}</span>}
    </div>
  )
}

export const imageUrl = (value: unknown): string | undefined =>
  typeof value === 'string' ? value || undefined : ((value as Media | null)?.url ?? undefined)
