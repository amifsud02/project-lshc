'use client'

import { useState } from 'react'

export default function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body?.errors?.[0]?.message ?? 'Invalid email or password.')
        setBusy(false)
        return
      }
      window.location.assign(redirectTo)
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Please try again.')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <label className="shop-field">
        <span className="shop-field__label shop-field__label--required">Email</span>
        <input
          className="shop-field__input"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label className="shop-field">
        <span className="shop-field__label shop-field__label--required">Password</span>
        <input
          className="shop-field__input"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      {error && <p className="shop-error">{error}</p>}
      <button type="submit" className="shop-btn shop-btn--block" disabled={busy}>
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
