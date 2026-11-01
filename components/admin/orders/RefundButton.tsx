'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { refundOrder } from '@/lib/shop/refundActions'

/** Amount box plus a two-step refund: "Refund €X", then "Confirm refund of €X". */
export function RefundButton({ orderId, maxCents }: { orderId: string; maxCents: number }) {
  const [amount, setAmount] = useState((maxCents / 100).toFixed(2))
  const [confirming, setConfirming] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [pending, start] = useTransition()
  const router = useRouter()
  const cents = Math.round(Number(amount.replace(',', '.')) * 100)
  const valid = cents > 0 && cents <= maxCents

  const onRefund = () =>
    start(async () => {
      const res = await refundOrder(orderId, cents)
      setResult(res)
      setConfirming(false)
      if (res.ok) setTimeout(() => router.refresh(), 4000)
    })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span>Amount (€)</span>
        <input
          id="refund-amount"
          inputMode="decimal"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value)
            setConfirming(false)
          }}
          style={{ padding: '8px 10px', border: '1px solid var(--theme-elevation-150)', borderRadius: 'var(--style-radius-s)', font: 'inherit', background: 'var(--theme-input-bg)', color: 'var(--theme-text)' }}
        />
      </label>
      {confirming ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn btn--style-primary btn--size-small" style={{ margin: 0, background: 'var(--theme-error-500)' }} disabled={pending} onClick={onRefund}>
            {pending ? 'Refunding…' : `Confirm refund of €${(cents / 100).toFixed(2)}`}
          </button>
          <button type="button" className="btn btn--style-secondary btn--size-small" style={{ margin: 0 }} onClick={() => setConfirming(false)}>
            Cancel
          </button>
        </div>
      ) : (
        <button type="button" className="btn btn--style-secondary btn--size-small" style={{ margin: 0 }} disabled={!valid} onClick={() => setConfirming(true)}>
          {valid ? `Refund €${(cents / 100).toFixed(2)}` : `Up to €${(maxCents / 100).toFixed(2)}`}
        </button>
      )}
      {result && (
        <div role="status" style={{ fontSize: 13, color: result.ok ? 'var(--theme-success-750)' : 'var(--theme-error-750)' }}>
          {result.message}
        </div>
      )}
    </div>
  )
}
