'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { GoogleMark } from './GoogleMark'

type Mode = 'login' | 'register'
type Method = 'link' | 'password'

type Props = {
  mode: Mode
  redirectTo: string
  googleEnabled: boolean
  /** Human-readable message from a failed Google round trip, if any. */
  googleError?: string | null
  /** Human-readable message from a failed magic link, if any. */
  linkError?: string | null
}

const copy = {
  login: {
    title: 'Welcome back',
    lead: 'Sign in to see your orders and keep your club details up to date.',
    submit: 'Email me a sign-in link',
    switchText: 'New here?',
    switchLink: 'Create an account',
    switchHref: '/register',
  },
  register: {
    title: 'Create your account',
    lead: 'No password to remember. We will email you a link that signs you in.',
    submit: 'Email me a link',
    switchText: 'Already have an account?',
    switchLink: 'Sign in',
    switchHref: '/login',
  },
} satisfies Record<Mode, Record<string, string>>

const RESEND_COOLDOWN = 30

export default function AuthForm({ mode, redirectTo, googleEnabled, googleError, linkError }: Props) {
  const text = copy[mode]

  const [method, setMethod] = useState<Method>('link')
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const id = window.setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => window.clearTimeout(id)
  }, [cooldown])

  const googleHref = `/api/oauth/google?for=site&redirect=${encodeURIComponent(redirectTo)}`

  const requestLink = async (address: string) => {
    setError(null)
    setBusy(true)
    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: address, firstName, lastName, redirectTo }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body?.error ?? 'We could not send your link. Please try again.')
        return
      }
      setSentTo(address)
      setCooldown(RESEND_COOLDOWN)
    } catch {
      setError('We could not reach the server. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  const signInWithPassword = async () => {
    setError(null)
    setBusy(true)
    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        setError('That email and password do not match. Try again, or email yourself a sign-in link.')
        setBusy(false)
        return
      }
      window.location.assign(redirectTo)
    } catch {
      setError('We could not reach the server. Check your connection and try again.')
      setBusy(false)
    }
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (method === 'password') void signInWithPassword()
    else void requestLink(email.trim())
  }

  if (sentTo) {
    return (
      <div className="auth-card">
        <div className="auth-status" role="status" aria-live="polite">
          <div className="auth-status__icon">
            <MailIcon />
          </div>
          <h2 className="auth-status__title">Check your inbox</h2>
          <p className="auth-status__body">
            We sent a sign-in link to <strong>{sentTo}</strong>. It works once and expires in 15 minutes.
            If you cannot see it, check your spam folder.
          </p>
          {error ? <p className="field__error" style={{ marginTop: 14 }}>{error}</p> : null}
          <div className="auth-status__actions">
            <button
              type="button"
              className="btn btn--ghost"
              disabled={busy || cooldown > 0}
              onClick={() => void requestLink(sentTo)}
            >
              {busy ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend link'}
            </button>
            <button
              type="button"
              className="btn-text"
              style={{ alignSelf: 'center' }}
              onClick={() => {
                setSentTo(null)
                setError(null)
              }}
            >
              Use a different email
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-card">
      <h2 className="auth-card__title">{text.title}</h2>
      <p className="auth-card__lead">{text.lead}</p>

      {googleError ? <Alert tone="error">{googleError}</Alert> : null}
      {linkError ? <Alert tone="error">{linkError}</Alert> : null}

      {googleEnabled ? (
        <>
          {/* A route handler, not a page — it must be a full navigation so the 302 to Google is followed. */}
          <a href={googleHref} className="auth-google">
            <GoogleMark />
            Continue with Google
          </a>
          <div className="divider" aria-hidden="true">
            or
          </div>
        </>
      ) : null}

      <form onSubmit={onSubmit} className="auth-form" noValidate={false}>
        {mode === 'register' ? (
          <div className="auth-form__row">
            <label className="field">
              <span className="field__label">
                First name <span className="field__optional">(optional)</span>
              </span>
              <input
                className="field__input"
                type="text"
                name="given-name"
                autoComplete="given-name"
                autoCapitalize="words"
                maxLength={80}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </label>
            <label className="field">
              <span className="field__label">
                Last name <span className="field__optional">(optional)</span>
              </span>
              <input
                className="field__input"
                type="text"
                name="family-name"
                autoComplete="family-name"
                autoCapitalize="words"
                maxLength={80}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </label>
          </div>
        ) : null}

        <label className="field">
          <span className="field__label">Email</span>
          <input
            className="field__input"
            type="email"
            name="email"
            inputMode="email"
            autoComplete={method === 'password' ? 'username' : 'email'}
            autoCapitalize="none"
            spellCheck={false}
            placeholder="you@example.com"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        {method === 'password' ? (
          <label className="field">
            <span className="field__label">Password</span>
            <div className="input-wrap">
              <input
                className="field__input"
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="input-wrap__action"
                onClick={() => setShowPassword((v) => !v)}
                aria-pressed={showPassword}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>
        ) : null}

        {error ? (
          <p className="field__error" role="alert">
            {error}
          </p>
        ) : null}

        <button type="submit" className="btn btn--block" disabled={busy}>
          {busy ? 'One moment…' : method === 'password' ? 'Sign in' : text.submit}
        </button>

        <div className="auth-form__footer">
          {method === 'link' ? (
            <p className="auth-note">
              We will email you a one-time link. No password needed.
            </p>
          ) : null}
          {mode === 'login' ? (
            <button
              type="button"
              className="btn-text"
              onClick={() => {
                setError(null)
                setMethod((m) => (m === 'link' ? 'password' : 'link'))
              }}
            >
              {method === 'link' ? 'Sign in with a password instead' : 'Email me a sign-in link instead'}
            </button>
          ) : null}
        </div>
      </form>

      <p className="auth-switch">
        {text.switchText}{' '}
        <Link
          href={
            redirectTo !== '/account'
              ? `${text.switchHref}?redirect=${encodeURIComponent(redirectTo)}`
              : text.switchHref
          }
        >
          {text.switchLink}
        </Link>
      </p>
    </div>
  )
}

function Alert({ tone, children }: { tone: 'error' | 'info'; children: React.ReactNode }) {
  return (
    <div className={`alert alert--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
      <span>{children}</span>
    </div>
  )
}

function MailIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </svg>
  )
}
