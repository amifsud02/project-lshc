'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { magicLinkErrorMessages, type MagicLinkError } from '@/lib/auth/magicLinkMessages'

type State = { kind: 'working' } | { kind: 'done' } | { kind: 'error'; message: string }

const genericError = 'We could not sign you in with this link. Request a new one below.'

/**
 * Redeems the token with a POST fired from the browser, so a mail server that
 * pre-opens links cannot use the link up before the person does.
 */
export default function VerifyMagicLink({ token }: { token: string | null }) {
  const started = useRef(false)
  const [state, setState] = useState<State>(() =>
    token ? { kind: 'working' } : { kind: 'error', message: magicLinkErrorMessages.invalid },
  )

  useEffect(() => {
    if (!token || started.current) return
    started.current = true

    const run = async () => {
      try {
        const res = await fetch('/api/auth/magic-link/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
        const body = await res.json().catch(() => ({}))
        if (!res.ok) {
          const code = body?.error as MagicLinkError | undefined
          setState({ kind: 'error', message: (code && magicLinkErrorMessages[code]) || genericError })
          return
        }
        setState({ kind: 'done' })
        window.location.replace(typeof body?.redirectTo === 'string' ? body.redirectTo : '/account')
      } catch {
        setState({ kind: 'error', message: genericError })
      }
    }
    void run()
  }, [token])

  if (state.kind === 'error') {
    return (
      <div className="auth-card">
        <div className="auth-status" role="alert">
          <div className="auth-status__icon auth-status__icon--error">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
              <path d="M12 9v4M12 17h.01" />
            </svg>
          </div>
          <h2 className="auth-status__title">That link did not work</h2>
          <p className="auth-status__body">{state.message}</p>
          <div className="auth-status__actions">
            <Link href="/login" className="btn">
              Request a new link
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-card">
      <div className="auth-status" role="status" aria-live="polite">
        <div className="auth-status__icon">
          <span className="spinner" />
        </div>
        <h2 className="auth-status__title">
          {state.kind === 'done' ? 'You are signed in' : 'Signing you in…'}
        </h2>
        <p className="auth-status__body">
          {state.kind === 'done' ? 'Taking you to your account.' : 'This only takes a second.'}
        </p>
      </div>
    </div>
  )
}
