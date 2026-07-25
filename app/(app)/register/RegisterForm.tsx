'use client'

import { useState } from 'react'

export default function RegisterForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const createRes = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstName, lastName, phone }),
      })
      if (!createRes.ok) {
        const body = await createRes.json().catch(() => ({}))
        setError(body?.errors?.[0]?.message ?? 'Could not create account.')
        setBusy(false)
        return
      }

      const loginRes = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!loginRes.ok) {
        window.location.assign('/login')
        return
      }
      window.location.assign('/account')
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Please try again.')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        <label className="shop-field">
          <span className="shop-field__label">First name</span>
          <input
            className="shop-field__input"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </label>
        <label className="shop-field">
          <span className="shop-field__label">Last name</span>
          <input
            className="shop-field__input"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </label>
      </div>
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
        <span className="shop-field__label">Phone</span>
        <input
          className="shop-field__input"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </label>
      <label className="shop-field">
        <span className="shop-field__label shop-field__label--required">Password</span>
        <input
          className="shop-field__input"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      {error && <p className="shop-error">{error}</p>}
      <button type="submit" className="shop-btn shop-btn--block" disabled={busy}>
        {busy ? 'Creating…' : 'Create account'}
      </button>
    </form>
  )
}
