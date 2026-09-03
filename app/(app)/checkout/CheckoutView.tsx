'use client'

import Link from 'next/link'
import { useState, useSyncExternalStore } from 'react'
import { useCart } from '@/lib/shop/cart'
import { formatPrice } from '@/lib/shop/types'
import { createCheckoutSession } from './actions'

type Props = {
  defaults: { email: string; name: string; phone: string }
}

const emptySubscribe = () => () => {}

export default function CheckoutView({ defaults }: Props) {
  const items = useCart((s) => s.items)
  const subtotal = useCart((s) => s.subtotal())
  const [email, setEmail] = useState(defaults.email)
  const [name, setName] = useState(defaults.name)
  const [phone, setPhone] = useState(defaults.phone)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Render cart-dependent UI only after hydration so server/client markup match
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )

  if (mounted && items.length === 0) {
    return (
      <div className="empty-state">
        <p className="empty-state__eyebrow">Nothing to check out</p>
        <h2 className="empty-state__title">Your cart is empty</h2>
        <p className="empty-state__body">Add a membership, bundle or kit item to get started.</p>
        <Link href="/shop" className="shop-link">
          Back to shop
        </Link>
      </div>
    )
  }

  const onPay = async () => {
    setError(null)
    if (!email.trim()) {
      setError('Please enter an email address.')
      return
    }
    setBusy(true)
    try {
      const res = await createCheckoutSession({
        items,
        buyer: { email: email.trim(), name: name.trim(), phone: phone.trim() },
      })
      if (!res.ok) {
        setError(res.error)
        setBusy(false)
        return
      }
      window.location.assign(res.url)
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Please try again.')
      setBusy(false)
    }
  }

  return (
    <div className="shop__columns">
      <div className="shop__stack">
        <section className="checkout-section">
          <h2 className="checkout-section__title">
            <span className="checkout-section__number">01 —</span> Your details
          </h2>
          <p className="checkout-section__subtitle">
            We&apos;ll send the receipt and any follow-ups to the email below.
          </p>
          <div className="checkout-section__fields">
            <label className="field field--wide">
              <span className="field__label field__label--required">Email</span>
              <input
                className="field__input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="field">
              <span className="field__label">Full name</span>
              <input
                className="field__input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="field">
              <span className="field__label">Phone</span>
              <input
                className="field__input"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>
          </div>
        </section>

        <section className="checkout-section">
          <h2 className="checkout-section__title">
            <span className="checkout-section__number">02 —</span> Order summary
          </h2>
          <ul className="checkout-section__list">
            {items.map((item) => (
              <li key={item.lineId}>
                <span className="checkout-section__list-title">
                  {item.productTitle}{' '}
                  <span className="checkout-section__list-meta">× {item.quantity}</span>
                </span>
                <span className="checkout-section__list-amount shop__mono">
                  {formatPrice(item.unitPrice * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <aside className="summary">
        <p className="summary__label">Payment total</p>
        <div className="summary__row">
          <span>Subtotal</span>
          <span className="summary__amount">{formatPrice(subtotal)}</span>
        </div>
        <div className="summary__row">
          <span>VAT</span>
          <span className="summary__amount" style={{ color: 'rgba(255,255,255,0.6)' }}>
            incl.
          </span>
        </div>
        <div className="summary__row summary__row--total">
          <span>Total</span>
          <span className="summary__amount">{formatPrice(subtotal)}</span>
        </div>
        {error && (
          <p
            className="alert alert--error"
            style={{ background: 'rgba(255,255,255,0.08)', color: '#ffb4b4', marginTop: 16 }}
          >
            {error}
          </p>
        )}
        <div className="summary__cta">
          <button
            type="button"
            className="btn btn--light btn--block"
            onClick={onPay}
            disabled={busy}
          >
            {busy ? 'Redirecting…' : 'Pay with card'}
            {!busy && (
              <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden>
                <path d="M1 5H13M13 5L9 1M13 5L9 9" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            )}
          </button>
        </div>
        <p className="summary__help">
          <svg width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden>
            <path
              d="M6 1a3 3 0 0 0-3 3v2H2v7h8V6H9V4a3 3 0 0 0-3-3zm-2 5V4a2 2 0 1 1 4 0v2z"
              fill="currentColor"
            />
          </svg>
          Redirected to Stripe · 256-bit encryption
        </p>
      </aside>
    </div>
  )
}
