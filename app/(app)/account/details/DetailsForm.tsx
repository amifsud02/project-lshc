'use client'

import { useActionState, useState } from 'react'
import { changePassword, updateDetails, type ActionState } from './actions'

type Props = { email: string; firstName: string; lastName: string; phone: string }

export default function DetailsForm({ email, firstName, lastName, phone }: Props) {
  const [detailsState, detailsAction, detailsPending] = useActionState<ActionState, FormData>(updateDetails, null)
  const [passwordState, passwordAction, passwordPending] = useActionState<ActionState, FormData>(changePassword, null)
  const [showPasswords, setShowPasswords] = useState(false)

  return (
    <>
      <form action={detailsAction} className="account-form">
        <div className="account-form__row">
          <label className="shop-field">
            <span className="shop-field__label">First name</span>
            <input
              className="shop-field__input"
              type="text"
              name="firstName"
              autoComplete="given-name"
              defaultValue={firstName}
              maxLength={80}
            />
          </label>
          <label className="shop-field">
            <span className="shop-field__label">Last name</span>
            <input
              className="shop-field__input"
              type="text"
              name="lastName"
              autoComplete="family-name"
              defaultValue={lastName}
              maxLength={80}
            />
          </label>
        </div>

        <label className="shop-field">
          <span className="shop-field__label">Email address</span>
          <input className="shop-field__input" type="email" value={email} readOnly disabled />
          <span className="shop-field__hint">
            Your email is how you sign in and how we match orders to you, so it cannot be changed here.
            Contact the club if you need to move to a new address.
          </span>
        </label>

        <label className="shop-field">
          <span className="shop-field__label">
            Phone <span className="shop-field__optional">(optional)</span>
          </span>
          <input
            className="shop-field__input"
            type="tel"
            name="phone"
            inputMode="tel"
            autoComplete="tel"
            defaultValue={phone}
            maxLength={40}
          />
        </label>

        {detailsState ? (
          <p className={`account-alert account-alert--${detailsState.ok ? 'ok' : 'error'}`} role="status">
            {detailsState.message}
          </p>
        ) : null}

        <div className="account-form__actions">
          <button type="submit" className="shop-btn" disabled={detailsPending}>
            {detailsPending ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>

      <section className="account-section">
        <div className="account-section__head">
          <h3 className="account-section__title">Password</h3>
        </div>
        <p className="account-lead" style={{ marginBottom: 18 }}>
          Signed up with Google or an email link? You never need a password. Set one only if you
          would like the option of signing in with it.
        </p>

        <form action={passwordAction} className="account-form">
          <label className="shop-field">
            <span className="shop-field__label shop-field__label--required">Current password</span>
            <input
              className="shop-field__input"
              type={showPasswords ? 'text' : 'password'}
              name="currentPassword"
              autoComplete="current-password"
              required
            />
            <span className="shop-field__hint">
              Never set one? Use the sign-in link or Google instead. There is nothing to change.
            </span>
          </label>
          <div className="account-form__row">
            <label className="shop-field">
              <span className="shop-field__label shop-field__label--required">New password</span>
              <input
                className="shop-field__input"
                type={showPasswords ? 'text' : 'password'}
                name="newPassword"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
            <label className="shop-field">
              <span className="shop-field__label shop-field__label--required">Confirm new password</span>
              <input
                className="shop-field__input"
                type={showPasswords ? 'text' : 'password'}
                name="confirmPassword"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
          </div>

          {passwordState ? (
            <p className={`account-alert account-alert--${passwordState.ok ? 'ok' : 'error'}`} role="status">
              {passwordState.message}
            </p>
          ) : null}

          <div className="account-form__actions">
            <button type="submit" className="shop-btn" disabled={passwordPending}>
              {passwordPending ? 'Updating…' : 'Change password'}
            </button>
            <button type="button" className="auth-textbtn account-inline-link" style={{ background: 'none', border: 0, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }} onClick={() => setShowPasswords((v) => !v)}>
              {showPasswords ? 'Hide passwords' : 'Show passwords'}
            </button>
          </div>
        </form>
      </section>
    </>
  )
}
