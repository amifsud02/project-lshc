'use client'

import { useEffect, useState, useTransition, type CSSProperties } from 'react'
import { previewShopEmail, sendTestShopEmail } from '@/lib/email/testActions'

type Template = { kind: string; label: string; to: string; when: string }
type Preview = Awaited<ReturnType<typeof previewShopEmail>>

const border = '1px solid var(--theme-elevation-150)'
const muted: CSSProperties = { color: 'var(--theme-elevation-500)' }
const input: CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  border,
  borderRadius: 'var(--style-radius-s)',
  background: 'var(--theme-input-bg)',
  color: 'var(--theme-text)',
  font: 'inherit',
}

export function EmailTester({ templates, orders, defaultTo }: { templates: Template[]; orders: { id: string; label: string }[]; defaultTo: string }) {
  const [kind, setKind] = useState(templates[0]?.kind ?? 'confirmation')
  const [orderId, setOrderId] = useState(orders[0]?.id ?? 'sample')
  const [to, setTo] = useState(defaultTo)
  const [view, setView] = useState<'desktop' | 'mobile' | 'text'>('desktop')
  const [preview, setPreview] = useState<Preview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [sending, startSend] = useTransition()

  useEffect(() => {
    let live = true
    previewShopEmail(kind, orderId)
      .then((p) => {
        if (!live) return
        setPreview(p)
        setError(null)
      })
      .catch((e) => live && setError(e instanceof Error ? e.message : 'Could not build the preview.'))
    return () => {
      live = false
    }
  }, [kind, orderId])

  const onSend = () =>
    startSend(async () => {
      setResult(await sendTestShopEmail(kind, orderId, to))
    })

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 240px) minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>
      <div role="listbox" aria-label="Templates" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {templates.map((t) => (
          <button
            key={t.kind}
            type="button"
            role="option"
            aria-selected={t.kind === kind}
            onClick={() => setKind(t.kind)}
            style={{
              textAlign: 'left',
              padding: '10px 12px',
              border: t.kind === kind ? '1px solid var(--theme-text)' : border,
              borderRadius: 'var(--style-radius-s)',
              background: t.kind === kind ? 'var(--theme-elevation-50)' : 'transparent',
              color: 'var(--theme-text)',
              cursor: 'pointer',
              font: 'inherit',
            }}
          >
            <div style={{ fontWeight: t.kind === kind ? 700 : 500 }}>{t.label}</div>
            <div style={{ ...muted, fontSize: 12 }}>
              To {t.to.toLowerCase()} · {t.when.toLowerCase()}
            </div>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
          <label style={{ flex: '1 1 260px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span>Order data</span>
            <select id="email-order" value={orderId} onChange={(e) => setOrderId(e.target.value)} style={input}>
              <option value="sample">Sample data (made-up order)</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label style={{ flex: '1 1 220px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span>Send test to</span>
            <input id="email-to" type="email" value={to} onChange={(e) => setTo(e.target.value)} style={input} />
          </label>
          <button type="button" className="btn btn--style-primary btn--size-medium" style={{ margin: 0 }} disabled={sending} onClick={onSend}>
            {sending ? 'Sending…' : 'Send test'}
          </button>
        </div>

        {result && (
          <div
            role="status"
            style={{
              padding: '9px 12px',
              borderRadius: 'var(--style-radius-s)',
              background: result.ok ? 'var(--theme-success-100)' : 'var(--theme-warning-100)',
              color: result.ok ? 'var(--theme-success-750)' : 'var(--theme-warning-800)',
            }}
          >
            {result.message}
          </div>
        )}
        {error && <div style={{ color: 'var(--theme-error-750)' }}>{error}</div>}

        <div style={{ border, borderRadius: 'var(--style-radius-m)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, padding: '10px 14px', borderBottom: border, background: 'var(--theme-elevation-50)', fontSize: 13 }}>
            <span>
              <span style={muted}>Subject </span>
              <strong>[TEST] {preview?.subject ?? '…'}</strong>
            </span>
            <span>
              <span style={muted}>Normally to </span>
              {preview ? preview.to.join(', ') || 'nobody yet (set the staff list in Site Settings → Shop)' : '…'}
            </span>
            {preview?.replyTo && (
              <span>
                <span style={muted}>Replies to </span>
                {preview.replyTo}
              </span>
            )}
            <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              {(['desktop', 'mobile', 'text'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={view === v}
                  onClick={() => setView(v)}
                  style={{
                    padding: '2px 10px',
                    borderRadius: 999,
                    border,
                    background: view === v ? 'var(--theme-text)' : 'transparent',
                    color: view === v ? 'var(--theme-bg)' : 'var(--theme-text)',
                    cursor: 'pointer',
                    font: 'inherit',
                    fontSize: 12,
                  }}
                >
                  {v === 'text' ? 'Plain text' : v[0].toUpperCase() + v.slice(1)}
                </button>
              ))}
            </span>
          </div>
          {view === 'text' ? (
            <pre style={{ margin: 0, padding: 16, whiteSpace: 'pre-wrap', fontSize: 13, minHeight: 480 }}>{preview?.text}</pre>
          ) : (
            <div style={{ background: '#eef1f6', display: 'flex', justifyContent: 'center' }}>
              <iframe
                title="Email preview"
                sandbox=""
                srcDoc={preview?.html ?? ''}
                style={{ width: view === 'mobile' ? 390 : '100%', height: 760, border: 0, background: '#eef1f6' }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
