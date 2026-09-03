'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { dayLabel, formatTimeRange } from '@/lib/nursery/schedule'

export type FormSession = {
  day: string
  startTime: string
  endTime: string
  venueName: string
  note?: string
}

export type FormTier = {
  value: string
  label: string
  sessionsPerWeek: number
  priceCents: number
}

export type FormCategory = {
  id: string
  name: string
  schoolYearsLabel: string
  gender: 'any' | 'boys' | 'girls'
  birthYearFrom: number
  birthYearTo: number
  acceptingRegistrations: boolean
  sessions: FormSession[]
  tiers: FormTier[]
}

export type FormSeason = {
  title: string
  allowCardPayment: boolean
  allowBankTransfer: boolean
  privacyConsentLabel: string
  photoConsentLabel: string
  taxRebateEnabled: boolean
  taxRebateConsentLabel: string
  categories: FormCategory[]
}

type Props = {
  season: FormSeason
  privacyNotice?: ReactNode
  defaults: { email: string; firstName: string; lastName: string; phone: string }
  submitAction: (input: any) => Promise<{ ok: true; redirectTo: string } | { ok: false; error: string }>
}

const formatFee = (cents: number) =>
  new Intl.NumberFormat('en-MT', { style: 'currency', currency: 'EUR' }).format(cents / 100)

export default function RegistrationForm({ season, privacyNotice, defaults, submitAction }: Props) {
  const [parent, setParent] = useState({
    firstName: defaults.firstName,
    lastName: defaults.lastName,
    email: defaults.email,
    phone: defaults.phone,
    relationshipToChild: '',
    idCardNumber: '',
  })
  const [child, setChild] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '' as '' | 'boy' | 'girl',
    schoolYear: '',
    school: '',
    kitSize: '',
  })
  const [categoryId, setCategoryId] = useState('')
  const [tierValue, setTierValue] = useState('')
  const [emergencyContact, setEmergencyContact] = useState({
    name: '',
    phone: '',
    relationship: '',
  })
  const [medical, setMedical] = useState({
    conditions: '',
    allergies: '',
    medication: '',
    consentToTreatment: false,
  })
  const [consents, setConsents] = useState({ privacy: false, photo: false, taxRebate: false })
  const [parentNotes, setParentNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank-transfer'>(
    season.allowCardPayment ? 'card' : 'bank-transfer',
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const birthYear = child.dateOfBirth ? Number(child.dateOfBirth.slice(0, 4)) : null

  // Age groups overlap — a Year 4 child fits both Under 8 and Under 10 — so this
  // narrows the list and lets the parent choose rather than choosing for them.
  const eligible = useMemo(() => {
    if (!birthYear || !child.gender) return []
    return season.categories.filter((category) => {
      if (birthYear < category.birthYearFrom || birthYear > category.birthYearTo) return false
      if (category.gender === 'boys' && child.gender !== 'boy') return false
      if (category.gender === 'girls' && child.gender !== 'girl') return false
      return true
    })
  }, [season.categories, birthYear, child.gender])

  const selected = eligible.find((category) => category.id === categoryId) ?? null
  const tiers = selected?.tiers ?? []
  const selectedTier = tiers.find((tier) => tier.value === tierValue) ?? null

  const chooseCategory = (id: string) => {
    setCategoryId(id)
    const next = eligible.find((category) => category.id === id)
    // Fee tiers differ per group, so a previous choice rarely survives the switch.
    setTierValue(next?.tiers.length === 1 ? next.tiers[0].value : '')
  }

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!selected) {
      setError('Please choose an age group.')
      return
    }
    if (!selectedTier) {
      setError('Please choose how many sessions a week your child will attend.')
      return
    }
    if (!consents.privacy) {
      setError('Please accept the privacy notice to continue.')
      return
    }

    setBusy(true)
    try {
      const result = await submitAction({
        categoryId: selected.id,
        tierValue: selectedTier.value,
        paymentMethod,
        parent,
        child,
        emergencyContact,
        medical,
        consents,
        parentNotes,
      })
      if (!result.ok) {
        setError(result.error)
        setBusy(false)
        return
      }
      window.location.assign(result.redirectTo)
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Please try again.')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="shop__stack">
      <section className="checkout-section">
        <h2 className="checkout-section__title">
          <span className="checkout-section__number">01 —</span> Parent or guardian
        </h2>
        <div className="checkout-section__fields">
          <label className="shop-field">
            <span className="shop-field__label shop-field__label--required">First name</span>
            <input
              className="shop-field__input"
              required
              value={parent.firstName}
              onChange={(e) => setParent({ ...parent, firstName: e.target.value })}
            />
          </label>
          <label className="shop-field">
            <span className="shop-field__label shop-field__label--required">Last name</span>
            <input
              className="shop-field__input"
              required
              value={parent.lastName}
              onChange={(e) => setParent({ ...parent, lastName: e.target.value })}
            />
          </label>
          <label className="shop-field">
            <span className="shop-field__label shop-field__label--required">Email</span>
            <input
              className="shop-field__input"
              type="email"
              required
              value={parent.email}
              onChange={(e) => setParent({ ...parent, email: e.target.value })}
            />
          </label>
          <label className="shop-field">
            <span className="shop-field__label shop-field__label--required">Mobile</span>
            <input
              className="shop-field__input"
              type="tel"
              required
              value={parent.phone}
              onChange={(e) => setParent({ ...parent, phone: e.target.value })}
            />
          </label>
          <label className="shop-field shop-field--wide">
            <span className="shop-field__label">Relationship to child</span>
            <input
              className="shop-field__input"
              placeholder="Mother, father, guardian…"
              value={parent.relationshipToChild}
              onChange={(e) => setParent({ ...parent, relationshipToChild: e.target.value })}
            />
          </label>
        </div>
      </section>

      <section className="checkout-section">
        <h2 className="checkout-section__title">
          <span className="checkout-section__number">02 —</span> Your child
        </h2>
        <div className="checkout-section__fields">
          <label className="shop-field">
            <span className="shop-field__label shop-field__label--required">First name</span>
            <input
              className="shop-field__input"
              required
              value={child.firstName}
              onChange={(e) => setChild({ ...child, firstName: e.target.value })}
            />
          </label>
          <label className="shop-field">
            <span className="shop-field__label shop-field__label--required">Last name</span>
            <input
              className="shop-field__input"
              required
              value={child.lastName}
              onChange={(e) => setChild({ ...child, lastName: e.target.value })}
            />
          </label>
          <label className="shop-field">
            <span className="shop-field__label shop-field__label--required">Date of birth</span>
            <input
              className="shop-field__input"
              type="date"
              required
              value={child.dateOfBirth}
              onChange={(e) => {
                setChild({ ...child, dateOfBirth: e.target.value })
                setCategoryId('')
                setTierValue('')
              }}
            />
          </label>
          <label className="shop-field">
            <span className="shop-field__label shop-field__label--required">Boy or girl</span>
            <select
              className="shop-field__select"
              required
              value={child.gender}
              onChange={(e) => {
                setChild({ ...child, gender: e.target.value as 'boy' | 'girl' })
                setCategoryId('')
                setTierValue('')
              }}
            >
              <option value="">Select…</option>
              <option value="boy">Boy</option>
              <option value="girl">Girl</option>
            </select>
          </label>
          <label className="shop-field">
            <span className="shop-field__label shop-field__label--required">School year</span>
            <input
              className="shop-field__input"
              required
              placeholder="KG2, Year 4, Year 9…"
              value={child.schoolYear}
              onChange={(e) => setChild({ ...child, schoolYear: e.target.value })}
            />
          </label>
          <label className="shop-field">
            <span className="shop-field__label">School</span>
            <input
              className="shop-field__input"
              value={child.school}
              onChange={(e) => setChild({ ...child, school: e.target.value })}
            />
          </label>
          <label className="shop-field">
            <span className="shop-field__label">Kit size</span>
            <input
              className="shop-field__input"
              placeholder="e.g. 9–10 years"
              value={child.kitSize}
              onChange={(e) => setChild({ ...child, kitSize: e.target.value })}
            />
          </label>
        </div>
      </section>

      <section className="checkout-section">
        <h2 className="checkout-section__title">
          <span className="checkout-section__number">03 —</span> Age group
        </h2>
        {!birthYear || !child.gender ? (
          <p className="checkout-section__subtitle">
            Enter your child&apos;s date of birth above and we&apos;ll show the groups they can join.
          </p>
        ) : eligible.length === 0 ? (
          <p className="shop-error">
            We don&apos;t have a group for that age this season. Please get in touch and we&apos;ll
            help.
          </p>
        ) : (
          <div className="nursery-choice">
            {eligible.map((category) => {
              const disabled = !category.acceptingRegistrations
              return (
                <label
                  key={category.id}
                  className={`nursery-choice__option${
                    categoryId === category.id ? ' nursery-choice__option--selected' : ''
                  }${disabled ? ' nursery-choice__option--disabled' : ''}`}
                >
                  <input
                    type="radio"
                    name="category"
                    value={category.id}
                    disabled={disabled}
                    checked={categoryId === category.id}
                    onChange={() => chooseCategory(category.id)}
                  />
                  <span className="nursery-choice__body">
                    <span className="nursery-choice__title">
                      {category.name}
                      <span className="nursery-choice__meta">{category.schoolYearsLabel}</span>
                      {disabled && <span className="nursery-choice__flag">Full</span>}
                    </span>
                    <span className="nursery-choice__sessions">
                      {category.sessions.map((session, index) => (
                        <span key={index}>
                          {dayLabel(session.day)} · {formatTimeRange(session.startTime, session.endTime)} ·{' '}
                          {session.venueName}
                        </span>
                      ))}
                    </span>
                  </span>
                </label>
              )
            })}
          </div>
        )}
      </section>

      {selected && (
        <section className="checkout-section">
          <h2 className="checkout-section__title">
            <span className="checkout-section__number">04 —</span> Sessions per week
          </h2>
          <div className="nursery-choice">
            {tiers.map((tier) => (
              <label
                key={tier.value}
                className={`nursery-choice__option${
                  tierValue === tier.value ? ' nursery-choice__option--selected' : ''
                }`}
              >
                <input
                  type="radio"
                  name="tier"
                  value={tier.value}
                  checked={tierValue === tier.value}
                  onChange={() => setTierValue(tier.value)}
                />
                <span className="nursery-choice__body">
                  <span className="nursery-choice__title">
                    {tier.label}
                    <span className="nursery-choice__price">{formatFee(tier.priceCents)}</span>
                  </span>
                </span>
              </label>
            ))}
          </div>
        </section>
      )}

      <section className="checkout-section">
        <h2 className="checkout-section__title">
          <span className="checkout-section__number">05 —</span> Emergency contact and health
        </h2>
        <p className="checkout-section__subtitle">
          Health details are seen only by the nursery coordinator and are used to keep your child
          safe at training.
        </p>
        <div className="checkout-section__fields">
          <label className="shop-field">
            <span className="shop-field__label">Emergency contact name</span>
            <input
              className="shop-field__input"
              value={emergencyContact.name}
              onChange={(e) => setEmergencyContact({ ...emergencyContact, name: e.target.value })}
            />
          </label>
          <label className="shop-field">
            <span className="shop-field__label">Emergency contact number</span>
            <input
              className="shop-field__input"
              type="tel"
              value={emergencyContact.phone}
              onChange={(e) => setEmergencyContact({ ...emergencyContact, phone: e.target.value })}
            />
          </label>
          <label className="shop-field shop-field--wide">
            <span className="shop-field__label">Medical conditions</span>
            <textarea
              className="shop-field__input"
              rows={2}
              value={medical.conditions}
              onChange={(e) => setMedical({ ...medical, conditions: e.target.value })}
            />
          </label>
          <label className="shop-field">
            <span className="shop-field__label">Allergies</span>
            <textarea
              className="shop-field__input"
              rows={2}
              value={medical.allergies}
              onChange={(e) => setMedical({ ...medical, allergies: e.target.value })}
            />
          </label>
          <label className="shop-field">
            <span className="shop-field__label">Regular medication</span>
            <textarea
              className="shop-field__input"
              rows={2}
              value={medical.medication}
              onChange={(e) => setMedical({ ...medical, medication: e.target.value })}
            />
          </label>
        </div>
        <label className="nursery-consent">
          <input
            type="checkbox"
            checked={medical.consentToTreatment}
            onChange={(e) => setMedical({ ...medical, consentToTreatment: e.target.checked })}
          />
          <span>
            I consent to my child receiving emergency medical treatment if I cannot be reached.
          </span>
        </label>
      </section>

      <section className="checkout-section">
        <h2 className="checkout-section__title">
          <span className="checkout-section__number">06 —</span> Consents
        </h2>
        {privacyNotice && <div className="nursery-notice">{privacyNotice}</div>}
        <label className="nursery-consent">
          <input
            type="checkbox"
            required
            checked={consents.privacy}
            onChange={(e) => setConsents({ ...consents, privacy: e.target.checked })}
          />
          <span>{season.privacyConsentLabel}</span>
        </label>
        <label className="nursery-consent">
          <input
            type="checkbox"
            checked={consents.photo}
            onChange={(e) => setConsents({ ...consents, photo: e.target.checked })}
          />
          <span>{season.photoConsentLabel}</span>
        </label>
        {season.taxRebateEnabled && (
          <>
            <label className="nursery-consent">
              <input
                type="checkbox"
                checked={consents.taxRebate}
                onChange={(e) => setConsents({ ...consents, taxRebate: e.target.checked })}
              />
              <span>{season.taxRebateConsentLabel}</span>
            </label>
            {consents.taxRebate && (
              <label className="shop-field">
                <span className="shop-field__label">ID card number of the claiming parent</span>
                <input
                  className="shop-field__input"
                  value={parent.idCardNumber}
                  onChange={(e) => setParent({ ...parent, idCardNumber: e.target.value })}
                />
              </label>
            )}
          </>
        )}
        <label className="shop-field">
          <span className="shop-field__label">Anything else we should know</span>
          <textarea
            className="shop-field__input"
            rows={3}
            value={parentNotes}
            onChange={(e) => setParentNotes(e.target.value)}
          />
        </label>
      </section>

      <section className="checkout-section">
        <h2 className="checkout-section__title">
          <span className="checkout-section__number">07 —</span> Payment
        </h2>
        <div className="nursery-choice">
          {season.allowCardPayment && (
            <label
              className={`nursery-choice__option${
                paymentMethod === 'card' ? ' nursery-choice__option--selected' : ''
              }`}
            >
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === 'card'}
                onChange={() => setPaymentMethod('card')}
              />
              <span className="nursery-choice__body">
                <span className="nursery-choice__title">Pay now by card</span>
                <span className="nursery-choice__sessions">
                  <span>You&apos;ll be taken to our secure payment page.</span>
                </span>
              </span>
            </label>
          )}
          {season.allowBankTransfer && (
            <label
              className={`nursery-choice__option${
                paymentMethod === 'bank-transfer' ? ' nursery-choice__option--selected' : ''
              }`}
            >
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === 'bank-transfer'}
                onChange={() => setPaymentMethod('bank-transfer')}
              />
              <span className="nursery-choice__body">
                <span className="nursery-choice__title">Pay by bank transfer</span>
                <span className="nursery-choice__sessions">
                  <span>We&apos;ll email you the account details and your reference.</span>
                </span>
              </span>
            </label>
          )}
        </div>

        {selectedTier && (
          <p className="nursery-total">
            <span>Total for the {season.title} season</span>
            <strong>{formatFee(selectedTier.priceCents)}</strong>
          </p>
        )}

        {error && <p className="shop-error">{error}</p>}

        <button type="submit" className="shop-btn shop-btn--block" disabled={busy}>
          {busy
            ? 'Please wait…'
            : paymentMethod === 'card'
              ? 'Continue to payment'
              : 'Complete registration'}
        </button>
      </section>
    </form>
  )
}
