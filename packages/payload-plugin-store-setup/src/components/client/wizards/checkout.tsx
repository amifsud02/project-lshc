'use client'

import { FIELD_VISIBILITY, RETENTION_UNITS } from '../../../reference'
import { Callout, ChoiceCards, Field, NumberInput, Row, Select, TextArea, TextInput, Toggle } from '../controls'
import type { StepContext, WizardDef } from '../engine'

const RETENTION: [string, string, string][] = [
  ['inactiveAccounts', 'Inactive customer accounts', 'Deleted after no logins or orders for'],
  ['pendingOrders', 'Unpaid (pending) orders', 'Moved to trash after'],
  ['failedOrders', 'Failed orders', 'Moved to trash after'],
  ['cancelledOrders', 'Cancelled orders', 'Moved to trash after'],
  ['completedOrders', 'Completed orders', 'Personal data anonymised after'],
]

/** A mini checkout form that follows the field and account settings. */
function CheckoutPreview({ ctx }: { ctx: StepContext }) {
  const c = (k: string) => ctx.get(`checkout.${k}`)
  const field = (key: string, label: string) =>
    c(key) === 'hidden' ? null : (
      <span className="ss-fake-input">
        {label}
        {c(key) === 'optional' && <em> (optional)</em>}
      </span>
    )
  return (
    <div className="ss-example ss-fake-checkout">
      <span className="ss-eyebrow">Checkout preview</span>
      {c('loginReminder') && <p className="ss-fake-note">Returning customer? Click here to log in</p>}
      {c('guestCheckout') === false && <p className="ss-fake-note">You must be logged in to check out.</p>}
      <span className="ss-fake-input">Email address</span>
      <span className="ss-fake-input">Full name</span>
      {field('companyField', 'Company name')}
      <span className="ss-fake-input">Street address</span>
      {field('address2Field', 'Apartment, suite, unit')}
      {field('phoneField', 'Phone')}
      {c('signupAtCheckout') && <span className="ss-fake-check">☐ Create an account?</span>}
      {c('termsUrl') && <span className="ss-fake-check">☐ I have read and agree to the terms and conditions</span>}
    </div>
  )
}

export const checkoutWizard: WizardDef = {
  id: 'checkout',
  sections: ['checkout'],
  steps: [
    {
      id: 'accounts',
      title: 'Guest checkout and accounts',
      description: 'Letting people buy without an account usually means more completed orders.',
      render: (ctx) => (
        <div className="ss-split">
          <div>
            {(ctx.get('profile.productTypes') ?? []).some((t: string) => ['memberships', 'subscriptions'].includes(t)) && (
              <Callout>You sell memberships or subscriptions — customers will need an account to manage them, so consider turning on account creation at checkout.</Callout>
            )}
            <Toggle label="Allow customers to place orders without an account" checked={ctx.get('checkout.guestCheckout')} onChange={(v) => ctx.set('checkout.guestCheckout', v)} />
            <Toggle label="Remind customers they can log in during checkout" checked={ctx.get('checkout.loginReminder')} onChange={(v) => ctx.set('checkout.loginReminder', v)} />
            <Toggle label="Allow account creation during checkout" checked={ctx.get('checkout.signupAtCheckout')} onChange={(v) => ctx.set('checkout.signupAtCheckout', v)} />
            <Toggle label="Allow account creation on the “My account” page" checked={ctx.get('checkout.signupOnAccountPage')} onChange={(v) => ctx.set('checkout.signupOnAccountPage', v)} />
            {(ctx.get('checkout.signupAtCheckout') || ctx.get('checkout.signupOnAccountPage')) && (
              <Toggle
                label="Send new customers a link to set their password"
                help="Instead of asking for a password during checkout."
                checked={ctx.get('checkout.sendPasswordLink')}
                onChange={(v) => ctx.set('checkout.sendPasswordLink', v)}
              />
            )}
          </div>
          <CheckoutPreview ctx={ctx} />
        </div>
      ),
    },
    {
      id: 'fields',
      title: 'Checkout fields',
      description: 'Ask only for what you need. Every extra field costs a few orders.',
      render: (ctx) => (
        <div className="ss-split">
          <div>
            {(
              [
                ['companyField', 'Company name'],
                ['address2Field', 'Address line 2'],
                ['phoneField', 'Phone'],
              ] as const
            ).map(([key, label]) => (
              <Field key={key} label={label}>
                <ChoiceCards columns={3} options={FIELD_VISIBILITY} value={ctx.get(`checkout.${key}`) ?? 'optional'} onChange={(v) => ctx.set(`checkout.${key}`, v)} />
              </Field>
            ))}
          </div>
          <CheckoutPreview ctx={ctx} />
        </div>
      ),
    },
    {
      id: 'policies',
      title: 'Policies',
      description: 'Links shown at checkout and on the registration form. Use [privacy_policy] to insert the privacy link.',
      render: (ctx) => (
        <>
          <Row>
            <Field label="Terms and conditions page" help="Adds an “I agree” checkbox to checkout.">
              <TextInput value={ctx.get('checkout.termsUrl')} placeholder="/terms" onChange={(v) => ctx.set('checkout.termsUrl', v)} />
            </Field>
            <Field label="Privacy policy page">
              <TextInput value={ctx.get('checkout.privacyUrl')} placeholder="/privacy" onChange={(v) => ctx.set('checkout.privacyUrl', v)} />
            </Field>
          </Row>
          <Field label="Checkout privacy notice">
            <TextArea value={ctx.get('checkout.checkoutPrivacyText')} onChange={(v) => ctx.set('checkout.checkoutPrivacyText', v)} />
          </Field>
          <Field label="Registration privacy notice">
            <TextArea value={ctx.get('checkout.registrationPrivacyText')} onChange={(v) => ctx.set('checkout.registrationPrivacyText', v)} />
          </Field>
        </>
      ),
      validate: (ctx) => (!ctx.get('checkout.privacyUrl') && /\[privacy_policy\]/.test(ctx.get('checkout.checkoutPrivacyText') ?? '') ? 'Add a privacy policy link — the notice refers to it.' : null),
    },
    {
      id: 'retention',
      title: 'Keep personal data only as long as you need it',
      description: 'Automatic clean-up helps with GDPR. Leave a value empty to keep data forever.',
      skippable: true,
      render: (ctx) => (
        <>
          <Toggle label="Remove personal data from orders when a customer asks to be erased" checked={ctx.get('checkout.eraseOrdersOnRequest')} onChange={(v) => ctx.set('checkout.eraseOrdersOnRequest', v)} />
          <Toggle label="Remove access to downloads when a customer asks to be erased" checked={ctx.get('checkout.eraseDownloadsOnRequest')} onChange={(v) => ctx.set('checkout.eraseDownloadsOnRequest', v)} />
          <div className="ss-retention">
            {RETENTION.map(([key, label, verb]) => (
              <div key={key} className="ss-retention__row">
                <span>
                  <strong>{label}</strong>
                  <small>{verb}</small>
                </span>
                <NumberInput value={ctx.get(`checkout.${key}Value`)} min={0} placeholder="Never" onChange={(v) => ctx.set(`checkout.${key}Value`, v)} />
                <Select options={RETENTION_UNITS} value={ctx.get(`checkout.${key}Unit`) ?? 'months'} onChange={(v) => ctx.set(`checkout.${key}Unit`, v)} />
              </div>
            ))}
          </div>
        </>
      ),
    },
  ],
}
