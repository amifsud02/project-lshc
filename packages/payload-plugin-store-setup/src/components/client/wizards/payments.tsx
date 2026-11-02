'use client'

import type { ReactNode } from 'react'
import { PAYMENT_GATEWAYS, SHIPPING_METHODS, type PaymentGateway } from '../../../reference'
import { Badge, Button, Callout, ChoiceCards, Field, Row, Select, TextArea, TextInput, Toggle } from '../controls'
import type { StepContext, WizardDef } from '../engine'

const INFO: Record<PaymentGateway, { name: string; blurb: string; kind: 'online' | 'offline' }> = {
  stripe: { name: 'Card payments (Stripe)', blurb: 'Visa, Mastercard, Amex, Apple Pay and Google Pay. Paid out to your bank automatically.', kind: 'online' },
  paypal: { name: 'PayPal', blurb: 'Customers pay with their PayPal balance or a card through PayPal.', kind: 'online' },
  bacs: { name: 'Direct bank transfer', blurb: 'Customers pay into your bank account; you mark the order paid when it arrives.', kind: 'offline' },
  cheque: { name: 'Cheque', blurb: 'Customers post a cheque. Orders wait on hold until it clears.', kind: 'offline' },
  cod: { name: 'Cash on delivery', blurb: 'Customers pay cash when the order is delivered or collected.', kind: 'offline' },
}

function Status({ ctx, id }: { ctx: StepContext; id: PaymentGateway }) {
  const env = ctx.state.env
  if (id === 'stripe') {
    if (env.stripe === 'live') return <Badge tone="success">Connected · live</Badge>
    if (env.stripe === 'test') return <Badge tone="warning">Connected · test mode</Badge>
    return <Badge tone="danger">Needs STRIPE_SECRET_KEY</Badge>
  }
  if (id === 'paypal') return env.paypal ? <Badge tone="success">Connected</Badge> : <Badge tone="danger">Needs PAYPAL_CLIENT_ID</Badge>
  return <Badge>No account needed</Badge>
}

const enabledIds = (ctx: StepContext) => PAYMENT_GATEWAYS.filter((id) => ctx.get(`payments.${id}.enabled`))

const ordered = (ctx: StepContext) => [...enabledIds(ctx)].sort((a, b) => (ctx.get(`payments.${a}.sortOrder`) ?? 0) - (ctx.get(`payments.${b}.sortOrder`) ?? 0))

function GatewaySection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="ss-section">
      <legend>{title}</legend>
      {children}
    </fieldset>
  )
}

function CommonFields({ ctx, id }: { ctx: StepContext; id: PaymentGateway }) {
  return (
    <>
      <Field label="Title" help="What customers see at checkout.">
        <TextInput value={ctx.get(`payments.${id}.title`)} onChange={(v) => ctx.set(`payments.${id}.title`, v)} />
      </Field>
      <Field label="Description">
        <TextArea rows={2} value={ctx.get(`payments.${id}.description`)} onChange={(v) => ctx.set(`payments.${id}.description`, v)} />
      </Field>
    </>
  )
}

function BankAccounts({ ctx }: { ctx: StepContext }) {
  const accounts: Record<string, string>[] = ctx.get('payments.bacs.accounts') ?? []
  const update = (i: number, key: string, value: string) => ctx.set('payments.bacs.accounts', accounts.map((a, j) => (j === i ? { ...a, [key]: value } : a)))
  return (
    <div className="ss-stack">
      {accounts.map((a, i) => (
        <div key={i} className="ss-subcard">
          <Row>
            <Field label="Account name">
              <TextInput value={a.accountName} onChange={(v) => update(i, 'accountName', v)} />
            </Field>
            <Field label="Bank name">
              <TextInput value={a.bankName} onChange={(v) => update(i, 'bankName', v)} />
            </Field>
          </Row>
          <Row>
            <Field label="IBAN">
              <TextInput value={a.iban} onChange={(v) => update(i, 'iban', v.toUpperCase())} />
            </Field>
            <Field label="BIC / SWIFT">
              <TextInput value={a.bic} onChange={(v) => update(i, 'bic', v.toUpperCase())} />
            </Field>
          </Row>
          <Row>
            <Field label="Account number">
              <TextInput value={a.accountNumber} onChange={(v) => update(i, 'accountNumber', v)} />
            </Field>
            <Field label="Sort code / routing number">
              <TextInput value={a.sortCode} onChange={(v) => update(i, 'sortCode', v)} />
            </Field>
          </Row>
          <Button kind="ghost" onClick={() => ctx.set('payments.bacs.accounts', accounts.filter((_, j) => j !== i))}>
            Remove account
          </Button>
        </div>
      ))}
      <Button kind="secondary" onClick={() => ctx.set('payments.bacs.accounts', [...accounts, { accountName: ctx.get('profile.storeName') ?? '' }])}>
        + Add bank account
      </Button>
    </div>
  )
}

export const paymentsWizard: WizardDef = {
  id: 'payments',
  sections: ['payments'],
  steps: [
    {
      id: 'choose',
      title: 'How will customers pay?',
      description: 'Turn on as many as you like. You can offer online and offline methods side by side.',
      render: (ctx) => {
        const offline = ctx.get('profile.sellingWhere') === 'offline'
        return (
          <>
            {offline && <Callout>You sell offline today, so cash on delivery and bank transfer may feel familiar to your customers.</Callout>}
            {(['online', 'offline'] as const).map((kind) => (
              <div key={kind} className="ss-stack">
                <h3 className="ss-subhead">{kind === 'online' ? 'Take payments online' : 'Offline payment methods'}</h3>
                {PAYMENT_GATEWAYS.filter((id) => INFO[id].kind === kind).map((id) => (
                  <div key={id} className={`ss-gateway${ctx.get(`payments.${id}.enabled`) ? ' is-on' : ''}`}>
                    <Toggle
                      label={<strong>{INFO[id].name}</strong>}
                      help={INFO[id].blurb}
                      checked={ctx.get(`payments.${id}.enabled`)}
                      onChange={(on) => {
                        ctx.set(`payments.${id}.enabled`, on)
                        if (on) ctx.set(`payments.${id}.sortOrder`, enabledIds(ctx).length)
                      }}
                    />
                    <Status ctx={ctx} id={id} />
                  </div>
                ))}
              </div>
            ))}
          </>
        )
      },
      validate: (ctx) => (enabledIds(ctx).length === 0 ? 'Turn on at least one way to get paid.' : null),
    },
    {
      id: 'configure',
      title: 'Set up your payment methods',
      render: (ctx) => (
        <div className="ss-stack">
          {ctx.get('payments.stripe.enabled') && (
            <GatewaySection title="Card payments (Stripe)">
              {ctx.state.env.stripe === 'missing' && (
                <Callout tone="warning">
                  Card payments need your Stripe keys on the server. Add <code>STRIPE_SECRET_KEY</code> (and your publishable key) to the environment and redeploy — keys are never stored in the database.
                </Callout>
              )}
              {ctx.state.env.stripe === 'test' && <Callout tone="warning">Stripe is in test mode: use test cards; no real money moves. Switch to live keys before launch.</Callout>}
              <CommonFields ctx={ctx} id="stripe" />
              <Row>
                <Field label="Statement descriptor" help="Shown on card statements, up to 22 characters.">
                  <TextInput maxLength={22} value={ctx.get('payments.stripe.statementDescriptor')} onChange={(v) => ctx.set('payments.stripe.statementDescriptor', v)} />
                </Field>
                <Field label="When to charge">
                  <Select
                    options={[
                      { value: 'automatic', label: 'Charge immediately' },
                      { value: 'manual', label: 'Authorise now, capture later' },
                    ]}
                    value={ctx.get('payments.stripe.capture') ?? 'automatic'}
                    onChange={(v) => ctx.set('payments.stripe.capture', v)}
                  />
                </Field>
              </Row>
              <Toggle label="Offer Apple Pay and Google Pay" checked={ctx.get('payments.stripe.walletButtons')} onChange={(v) => ctx.set('payments.stripe.walletButtons', v)} />
            </GatewaySection>
          )}
          {ctx.get('payments.paypal.enabled') && (
            <GatewaySection title="PayPal">
              {!ctx.state.env.paypal && (
                <Callout tone="warning">
                  Add <code>PAYPAL_CLIENT_ID</code> and <code>PAYPAL_CLIENT_SECRET</code> to the server environment to accept PayPal.
                </Callout>
              )}
              <CommonFields ctx={ctx} id="paypal" />
            </GatewaySection>
          )}
          {ctx.get('payments.bacs.enabled') && (
            <GatewaySection title="Direct bank transfer">
              <CommonFields ctx={ctx} id="bacs" />
              <Field label="Instructions" help="Added to the thank-you page and order emails.">
                <TextArea rows={2} value={ctx.get('payments.bacs.instructions')} onChange={(v) => ctx.set('payments.bacs.instructions', v)} />
              </Field>
              <Field label="Account details" help="Shown on the thank-you page and in the order email.">
                <BankAccounts ctx={ctx} />
              </Field>
            </GatewaySection>
          )}
          {ctx.get('payments.cheque.enabled') && (
            <GatewaySection title="Cheque">
              <CommonFields ctx={ctx} id="cheque" />
              <Field label="Instructions">
                <TextArea rows={2} value={ctx.get('payments.cheque.instructions')} onChange={(v) => ctx.set('payments.cheque.instructions', v)} />
              </Field>
            </GatewaySection>
          )}
          {ctx.get('payments.cod.enabled') && (
            <GatewaySection title="Cash on delivery">
              <CommonFields ctx={ctx} id="cod" />
              <Field label="Only allow with these shipping methods" help="Leave all unticked to allow it with every method.">
                <ChoiceCards multiple columns={3} options={SHIPPING_METHODS} value={ctx.get('payments.cod.enableForMethods')} onChange={(v) => ctx.set('payments.cod.enableForMethods', v)} />
              </Field>
              <Toggle label="Accept for orders that don’t need shipping" checked={ctx.get('payments.cod.acceptVirtual')} onChange={(v) => ctx.set('payments.cod.acceptVirtual', v)} />
            </GatewaySection>
          )}
        </div>
      ),
      validate: (ctx) => {
        if (!ctx.get('payments.bacs.enabled')) return null
        const accounts: Record<string, string>[] = ctx.get('payments.bacs.accounts') ?? []
        return accounts.some((a) => a.iban || a.accountNumber) ? null : 'Add at least one bank account with an IBAN or account number.'
      },
    },
    {
      id: 'order',
      title: 'How checkout will look',
      description: 'Customers see your methods in this order. Move the one you prefer to the top.',
      render: (ctx) => {
        const list = ordered(ctx)
        const move = (i: number, dir: -1 | 1) => {
          const next = [...list]
          ;[next[i], next[i + dir]] = [next[i + dir], next[i]]
          next.forEach((id, j) => ctx.set(`payments.${id}.sortOrder`, j))
        }
        return (
          <div className="ss-checkout-preview">
            <span className="ss-eyebrow">Payment</span>
            {list.map((id, i) => (
              <div key={id} className={`ss-checkout-preview__row${i === 0 ? ' is-selected' : ''}`}>
                <span className="ss-radio" aria-hidden />
                <span className="ss-checkout-preview__text">
                  <strong>{ctx.get(`payments.${id}.title`) || INFO[id].name}</strong>
                  {i === 0 && <small>{ctx.get(`payments.${id}.description`)}</small>}
                </span>
                <span className="ss-checkout-preview__move">
                  <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                    ↑
                  </button>
                  <button type="button" aria-label="Move down" disabled={i === list.length - 1} onClick={() => move(i, 1)}>
                    ↓
                  </button>
                </span>
              </div>
            ))}
          </div>
        )
      },
    },
  ],
  doneMessage: (ctx) =>
    ctx.state.tasks.find((t) => t.id === 'payments')?.complete
      ? 'Customers can now pay you at checkout.'
      : 'Saved — finish connecting your payment provider’s keys and this task will tick itself off.',
}
