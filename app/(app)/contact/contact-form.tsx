'use client'

import { useState } from 'react'
import './contact.css'

const EMPTY = { firstName: '', lastName: '', email: '', phone: '', message: '' }

export default function ContactForm() {
  const [values, setValues] = useState(EMPTY)
  const [contact, setContact] = useState<'General' | 'Nursery'>('General')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  const update = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues({ ...values, [e.target.name]: e.target.value })

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    setBusy(true)
    setResult(null)
    try {
      const response = await fetch('api/contact-form', {
        method: 'POST',
        body: new FormData(e.currentTarget),
      })
      const data = await response.json()
      const ok = data.status === 200
      if (ok) setValues(EMPTY)
      setResult({ ok, message: data.message })
    } catch {
      setResult({ ok: false, message: 'Something went wrong. Please try again.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="contact-form form-stack" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label className="field">
          <span className="field__label">First name</span>
          <input
            className="field__input"
            name="firstName"
            autoComplete="given-name"
            required
            value={values.firstName}
            onChange={update}
          />
        </label>
        <label className="field">
          <span className="field__label">Last name</span>
          <input
            className="field__input"
            name="lastName"
            autoComplete="family-name"
            required
            value={values.lastName}
            onChange={update}
          />
        </label>
        <label className="field">
          <span className="field__label">Email</span>
          <input
            className="field__input"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={values.email}
            onChange={update}
          />
        </label>
        <label className="field">
          <span className="field__label">
            Phone number <span className="field__optional">(optional)</span>
          </span>
          <input
            className="field__input"
            type="tel"
            name="phone"
            autoComplete="tel"
            value={values.phone}
            onChange={update}
          />
        </label>
        <label className="field field--wide">
          <span className="field__label">Message</span>
          <textarea
            className="field__textarea"
            name="message"
            required
            value={values.message}
            onChange={update}
          />
        </label>
      </div>

      <fieldset className="field">
        <legend className="field__label">What is this about?</legend>
        <div className="check-group check-group--inline">
          <label className="check">
            <input
              type="radio"
              name="contact"
              value="General"
              checked={contact === 'General'}
              onChange={() => setContact('General')}
            />
            <span>General enquiry</span>
          </label>
          <label className="check">
            <input
              type="radio"
              name="contact"
              value="Nursery"
              checked={contact === 'Nursery'}
              onChange={() => setContact('Nursery')}
            />
            <span>Nursery</span>
          </label>
        </div>
      </fieldset>

      {result && (
        <p className={`alert ${result.ok ? 'alert--ok' : 'alert--error'}`} role="status">
          {result.message}
        </p>
      )}

      <div className="contact-form__actions">
        <button type="submit" className="btn" disabled={busy}>
          {busy ? 'Sending…' : 'Send message'}
        </button>
      </div>
    </form>
  )
}
