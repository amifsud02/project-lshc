'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { dayLabel, formatTimeRange } from '@/lib/nursery/schedule'
import type { ExtraAnswerInput, FormConfig, FormSectionKey } from '@/lib/nursery/form'

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
  config: FormConfig
  intro?: ReactNode
  privacyNotice?: ReactNode
  defaults: { email: string; firstName: string; lastName: string; phone: string }
  submitAction: (input: any) => Promise<{ ok: true; redirectTo: string } | { ok: false; error: string }>
}

const formatFee = (cents: number) =>
  new Intl.NumberFormat('en-MT', { style: 'currency', currency: 'EUR' }).format(cents / 100)

const Optional = () => <span className="field__optional">(optional)</span>

export default function RegistrationForm({
  season,
  config,
  intro,
  privacyNotice,
  defaults,
  submitAction,
}: Props) {
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
  const [extraAnswers, setExtraAnswers] = useState<ExtraAnswerInput>({})
  const [consents, setConsents] = useState({ privacy: false, photo: false, taxRebate: false })
  const [parentNotes, setParentNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank-transfer'>(
    season.allowCardPayment ? 'card' : 'bank-transfer',
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { fields, sections, extraQuestions } = config
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

  const showHealth = fields.emergencyContact || fields.medical
  const showExtra = extraQuestions.length > 0

  // Section numbers follow whatever the season actually asks, so hiding the
  // health step in the CMS never leaves a gap in the count.
  const visibleSections: FormSectionKey[] = [
    'parent',
    'child',
    'group',
    'sessions',
    ...(showHealth ? (['health'] as const) : []),
    ...(showExtra ? (['extra'] as const) : []),
    'consents',
    'payment',
  ]
  const stepNumber = (key: FormSectionKey) => visibleSections.indexOf(key) + 1

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
        extraAnswers,
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

  const stepHead = (id: FormSectionKey) => (
    <header className="step-head">
      <span className="step-head__num" aria-hidden="true">
        {stepNumber(id)}
      </span>
      <div>
        <h2 className="step-head__title">{sections[id].title}</h2>
        {sections[id].description && <p className="step-head__desc">{sections[id].description}</p>}
      </div>
    </header>
  )

  return (
    <form onSubmit={onSubmit} className="reg">
      <div className="reg__intro">
        <p className="reg__season">Nursery {season.title}</p>
        {intro ? (
          <div className="reg__intro-copy">{intro}</div>
        ) : (
          <p className="reg__intro-copy">
            It takes about five minutes. You&apos;ll need your child&apos;s date of birth and school
            year, and we&apos;ll email you a confirmation as soon as you&apos;re done.
          </p>
        )}
      </div>

      <section className="reg-step">
        {stepHead('parent')}
        <div className="form-grid">
          <label className="field">
            <span className="field__label">First name</span>
            <input
              className="field__input"
              autoComplete="given-name"
              required
              value={parent.firstName}
              onChange={(e) => setParent({ ...parent, firstName: e.target.value })}
            />
          </label>
          <label className="field">
            <span className="field__label">Last name</span>
            <input
              className="field__input"
              autoComplete="family-name"
              required
              value={parent.lastName}
              onChange={(e) => setParent({ ...parent, lastName: e.target.value })}
            />
          </label>
          <label className="field">
            <span className="field__label">Email</span>
            <input
              className="field__input"
              type="email"
              autoComplete="email"
              required
              value={parent.email}
              onChange={(e) => setParent({ ...parent, email: e.target.value })}
            />
            <span className="field__hint">Your confirmation and the schedule go here.</span>
          </label>
          <label className="field">
            <span className="field__label">Mobile</span>
            <input
              className="field__input"
              type="tel"
              autoComplete="tel"
              required
              value={parent.phone}
              onChange={(e) => setParent({ ...parent, phone: e.target.value })}
            />
          </label>
          {fields.relationship && (
            <label className="field field--wide">
              <span className="field__label">
                Relationship to child <Optional />
              </span>
              <input
                className="field__input"
                placeholder="Mother, father, guardian…"
                value={parent.relationshipToChild}
                onChange={(e) => setParent({ ...parent, relationshipToChild: e.target.value })}
              />
            </label>
          )}
        </div>
      </section>

      <section className="reg-step">
        {stepHead('child')}
        <div className="form-grid">
          <label className="field">
            <span className="field__label">First name</span>
            <input
              className="field__input"
              required
              value={child.firstName}
              onChange={(e) => setChild({ ...child, firstName: e.target.value })}
            />
          </label>
          <label className="field">
            <span className="field__label">Last name</span>
            <input
              className="field__input"
              required
              value={child.lastName}
              onChange={(e) => setChild({ ...child, lastName: e.target.value })}
            />
          </label>
          <label className="field">
            <span className="field__label">Date of birth</span>
            <input
              className="field__input"
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
          <label className="field">
            <span className="field__label">Boy or girl</span>
            <select
              className="field__select"
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
          <label className="field">
            <span className="field__label">School year</span>
            <input
              className="field__input"
              required
              placeholder="KG2, Year 4, Year 9…"
              value={child.schoolYear}
              onChange={(e) => setChild({ ...child, schoolYear: e.target.value })}
            />
          </label>
          {fields.school && (
            <label className="field">
              <span className="field__label">
                School <Optional />
              </span>
              <input
                className="field__input"
                value={child.school}
                onChange={(e) => setChild({ ...child, school: e.target.value })}
              />
            </label>
          )}
          {fields.kitSize && (
            <label className="field">
              <span className="field__label">
                Kit size <Optional />
              </span>
              <input
                className="field__input"
                placeholder={fields.kitSizeHint}
                value={child.kitSize}
                onChange={(e) => setChild({ ...child, kitSize: e.target.value })}
              />
            </label>
          )}
        </div>
      </section>

      <section className="reg-step">
        {stepHead('group')}
        {!birthYear || !child.gender ? (
          <p className="reg-step__placeholder">
            Enter your child&apos;s date of birth above and we&apos;ll show the groups they can join.
          </p>
        ) : eligible.length === 0 ? (
          <p className="alert alert--error">
            We don&apos;t have a group for that age this season. Please get in touch and we&apos;ll
            help.
          </p>
        ) : (
          <div className="choice">
            {eligible.map((category) => {
              const disabled = !category.acceptingRegistrations
              return (
                <label
                  key={category.id}
                  className={`choice__option${
                    categoryId === category.id ? ' choice__option--selected' : ''
                  }${disabled ? ' choice__option--disabled' : ''}`}
                >
                  <input
                    type="radio"
                    name="category"
                    value={category.id}
                    disabled={disabled}
                    checked={categoryId === category.id}
                    onChange={() => chooseCategory(category.id)}
                  />
                  <span className="choice__body">
                    <span className="choice__title">
                      {category.name}
                      <span className="choice__meta">{category.schoolYearsLabel}</span>
                      {disabled && <span className="choice__flag">Full</span>}
                    </span>
                    <span className="choice__lines">
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

      <section className="reg-step">
        {stepHead('sessions')}
        {!selected ? (
          <p className="reg-step__placeholder">Choose an age group first.</p>
        ) : (
          <div className="choice">
            {tiers.map((tier) => (
              <label
                key={tier.value}
                className={`choice__option${
                  tierValue === tier.value ? ' choice__option--selected' : ''
                }`}
              >
                <input
                  type="radio"
                  name="tier"
                  value={tier.value}
                  checked={tierValue === tier.value}
                  onChange={() => setTierValue(tier.value)}
                />
                <span className="choice__body">
                  <span className="choice__title">
                    {tier.label}
                    <span className="choice__price">{formatFee(tier.priceCents)}</span>
                  </span>
                </span>
              </label>
            ))}
          </div>
        )}
      </section>

      {showHealth && (
        <section className="reg-step">
          {stepHead('health')}
          <div className="form-grid">
            {fields.emergencyContact && (
              <>
                <label className="field">
                  <span className="field__label">
                    Emergency contact name {!fields.emergencyContactRequired && <Optional />}
                  </span>
                  <input
                    className="field__input"
                    required={fields.emergencyContactRequired}
                    value={emergencyContact.name}
                    onChange={(e) =>
                      setEmergencyContact({ ...emergencyContact, name: e.target.value })
                    }
                  />
                </label>
                <label className="field">
                  <span className="field__label">
                    Emergency contact number {!fields.emergencyContactRequired && <Optional />}
                  </span>
                  <input
                    className="field__input"
                    type="tel"
                    required={fields.emergencyContactRequired}
                    value={emergencyContact.phone}
                    onChange={(e) =>
                      setEmergencyContact({ ...emergencyContact, phone: e.target.value })
                    }
                  />
                </label>
              </>
            )}
            {fields.medical && (
              <>
                <label className="field field--wide">
                  <span className="field__label">
                    Medical conditions <Optional />
                  </span>
                  <textarea
                    className="field__textarea field__textarea--short"
                    rows={2}
                    value={medical.conditions}
                    onChange={(e) => setMedical({ ...medical, conditions: e.target.value })}
                  />
                </label>
                <label className="field">
                  <span className="field__label">
                    Allergies <Optional />
                  </span>
                  <textarea
                    className="field__textarea field__textarea--short"
                    rows={2}
                    value={medical.allergies}
                    onChange={(e) => setMedical({ ...medical, allergies: e.target.value })}
                  />
                </label>
                <label className="field">
                  <span className="field__label">
                    Regular medication <Optional />
                  </span>
                  <textarea
                    className="field__textarea field__textarea--short"
                    rows={2}
                    value={medical.medication}
                    onChange={(e) => setMedical({ ...medical, medication: e.target.value })}
                  />
                </label>
              </>
            )}
          </div>
          {fields.medical && fields.medicalConsentLabel && (
            <label className="check">
              <input
                type="checkbox"
                checked={medical.consentToTreatment}
                onChange={(e) => setMedical({ ...medical, consentToTreatment: e.target.checked })}
              />
              <span>{fields.medicalConsentLabel}</span>
            </label>
          )}
        </section>
      )}

      {showExtra && (
        <section className="reg-step">
          {stepHead('extra')}
          <div className="form-grid">
            {extraQuestions.map((question) => {
              const value = extraAnswers[question.id]
              const set = (next: string | boolean) =>
                setExtraAnswers({ ...extraAnswers, [question.id]: next })
              if (question.type === 'checkbox') {
                return (
                  <label key={question.id} className="check field--wide">
                    <input
                      type="checkbox"
                      required={question.required}
                      checked={value === true}
                      onChange={(e) => set(e.target.checked)}
                    />
                    <span>
                      {question.label}
                      {question.hint && <span className="check__hint">{question.hint}</span>}
                    </span>
                  </label>
                )
              }
              const label = (
                <span className="field__label">
                  {question.label} {!question.required && <Optional />}
                </span>
              )
              const hint = question.hint && <span className="field__hint">{question.hint}</span>
              if (question.type === 'select') {
                return (
                  <label key={question.id} className="field">
                    {label}
                    <select
                      className="field__select"
                      required={question.required}
                      value={typeof value === 'string' ? value : ''}
                      onChange={(e) => set(e.target.value)}
                    >
                      <option value="">Select…</option>
                      {question.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    {hint}
                  </label>
                )
              }
              if (question.type === 'textarea') {
                return (
                  <label key={question.id} className="field field--wide">
                    {label}
                    <textarea
                      className="field__textarea field__textarea--short"
                      rows={3}
                      required={question.required}
                      value={typeof value === 'string' ? value : ''}
                      onChange={(e) => set(e.target.value)}
                    />
                    {hint}
                  </label>
                )
              }
              return (
                <label key={question.id} className="field">
                  {label}
                  <input
                    className="field__input"
                    required={question.required}
                    value={typeof value === 'string' ? value : ''}
                    onChange={(e) => set(e.target.value)}
                  />
                  {hint}
                </label>
              )
            })}
          </div>
        </section>
      )}

      <section className="reg-step">
        {stepHead('consents')}
        {privacyNotice && <div className="reg-notice">{privacyNotice}</div>}
        <div className="check-group">
          <label className="check">
            <input
              type="checkbox"
              required
              checked={consents.privacy}
              onChange={(e) => setConsents({ ...consents, privacy: e.target.checked })}
            />
            <span>{season.privacyConsentLabel}</span>
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={consents.photo}
              onChange={(e) => setConsents({ ...consents, photo: e.target.checked })}
            />
            <span>
              {season.photoConsentLabel} <Optional />
            </span>
          </label>
          {season.taxRebateEnabled && (
            <label className="check">
              <input
                type="checkbox"
                checked={consents.taxRebate}
                onChange={(e) => setConsents({ ...consents, taxRebate: e.target.checked })}
              />
              <span>
                {season.taxRebateConsentLabel} <Optional />
              </span>
            </label>
          )}
        </div>
        {season.taxRebateEnabled && consents.taxRebate && (
          <label className="field reg-step__single">
            <span className="field__label">ID card number of the claiming parent</span>
            <input
              className="field__input"
              value={parent.idCardNumber}
              onChange={(e) => setParent({ ...parent, idCardNumber: e.target.value })}
            />
            <span className="field__hint">Needed only for the tax rebate paperwork.</span>
          </label>
        )}
        {fields.notes && (
          <label className="field reg-step__single">
            <span className="field__label">
              {fields.notesLabel} <Optional />
            </span>
            <textarea
              className="field__textarea field__textarea--short"
              rows={3}
              value={parentNotes}
              onChange={(e) => setParentNotes(e.target.value)}
            />
          </label>
        )}
      </section>

      <section className="reg-step">
        {stepHead('payment')}
        <div className="choice">
          {season.allowCardPayment && (
            <label
              className={`choice__option${
                paymentMethod === 'card' ? ' choice__option--selected' : ''
              }`}
            >
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === 'card'}
                onChange={() => setPaymentMethod('card')}
              />
              <span className="choice__body">
                <span className="choice__title">Pay now by card</span>
                <span className="choice__lines">
                  <span>You&apos;ll be taken to our secure payment page.</span>
                </span>
              </span>
            </label>
          )}
          {season.allowBankTransfer && (
            <label
              className={`choice__option${
                paymentMethod === 'bank-transfer' ? ' choice__option--selected' : ''
              }`}
            >
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === 'bank-transfer'}
                onChange={() => setPaymentMethod('bank-transfer')}
              />
              <span className="choice__body">
                <span className="choice__title">Pay by bank transfer</span>
                <span className="choice__lines">
                  <span>We&apos;ll email you the account details and your reference.</span>
                </span>
              </span>
            </label>
          )}
        </div>

        <div className="reg-summary">
          <dl className="rows">
            <div>
              <dt>Age group</dt>
              <dd>{selected ? selected.name : '—'}</dd>
            </div>
            <div>
              <dt>Sessions</dt>
              <dd>{selectedTier ? selectedTier.label : '—'}</dd>
            </div>
            <div className="rows__total">
              <dt>Total for {season.title}</dt>
              <dd>{selectedTier ? formatFee(selectedTier.priceCents) : '—'}</dd>
            </div>
          </dl>

          {error && (
            <p className="alert alert--error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="btn btn--block" disabled={busy}>
            {busy
              ? 'Please wait…'
              : paymentMethod === 'card'
                ? config.submitLabelCard
                : config.submitLabelTransfer}
          </button>
        </div>
      </section>
    </form>
  )
}
