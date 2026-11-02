'use client'

import { useState } from 'react'
import { formatPrice } from '../../../format'
import { EMAIL_NOTIFICATIONS } from '../../../reference'
import { Button, Callout, ColorInput, Field, Row, TextArea, TextInput, Toggle } from '../controls'
import type { StepContext, WizardDef } from '../engine'
import { ImageUpload, imageUrl } from '../ImageUpload'

/** A rendered order email using the colours being edited. */
function EmailPreview({ ctx }: { ctx: StepContext }) {
  const e = ctx.get('emails') ?? {}
  const name = ctx.get('profile.storeName') || 'Your store'
  const s = { currency: ctx.get('currency') }
  const header = imageUrl(e.headerImage)
  return (
    <div className="ss-email" style={{ background: e.backgroundColor }}>
      {header && <img src={header} alt="" className="ss-email__logo" />}
      <div className="ss-email__body" style={{ background: e.bodyColor, color: e.textColor }}>
        <div className="ss-email__head" style={{ background: e.baseColor }}>
          Thank you for your order
        </div>
        <div className="ss-email__content">
          <p>Hi Alex,</p>
          <p>We’ve received your order #1042 and it’s now being processed.</p>
          <table>
            <tbody>
              <tr>
                <td>Classic T-shirt × 2</td>
                <td>{formatPrice(4400, s)}</td>
              </tr>
              <tr>
                <td>Shipping</td>
                <td>{formatPrice(450, s)}</td>
              </tr>
              <tr>
                <th>Total</th>
                <th style={{ color: e.baseColor }}>{formatPrice(4850, s)}</th>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <p className="ss-email__foot">{String(e.footerText ?? '').replace('{site_title}', name)}</p>
    </div>
  )
}

function TestSend({ ctx }: { ctx: StepContext }) {
  const [to, setTo] = useState(ctx.state.userEmail ?? '')
  const [status, setStatus] = useState<string | null>(null)
  if (!ctx.state.env.email) return <Callout tone="warning">No email adapter is configured in Payload, so emails can’t be sent yet.</Callout>
  return (
    <div className="ss-copy">
      <TextInput type="email" value={to} onChange={setTo} />
      <Button
        kind="secondary"
        onClick={async () => {
          setStatus('Sending…')
          try {
            // Save first so the test uses what's on screen.
            ctx.setState(await ctx.api.post('/settings', { patch: { emails: ctx.get('emails') } }))
            await ctx.api.post('/test-email', { to })
            setStatus(`Sent to ${to}`)
          } catch (err) {
            setStatus(err instanceof Error ? err.message : String(err))
          }
        }}
      >
        Send test email
      </Button>
      {status && <span className="ss-muted">{status}</span>}
    </div>
  )
}

export const emailsWizard: WizardDef = {
  id: 'emails',
  sections: ['emails'],
  steps: [
    {
      id: 'sender',
      title: 'Who are emails from?',
      description: 'Use an address on your own domain so emails don’t land in spam.',
      render: (ctx) => (
        <Row>
          <Field label="“From” name">
            <TextInput value={ctx.get('emails.fromName') ?? ctx.get('profile.storeName')} onChange={(v) => ctx.set('emails.fromName', v)} />
          </Field>
          <Field label="“From” address">
            <TextInput type="email" value={ctx.get('emails.fromAddress')} placeholder="orders@yourstore.com" onChange={(v) => ctx.set('emails.fromAddress', v)} />
          </Field>
        </Row>
      ),
      validate: (ctx) => {
        const a = ctx.get('emails.fromAddress')
        return a && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(a) ? 'That “from” address doesn’t look right.' : null
      },
    },
    {
      id: 'design',
      title: 'Make emails look like your brand',
      render: (ctx) => (
        <div className="ss-split">
          <div>
            <Field label="Header image">
              <ImageUpload ctx={ctx} path="emails.headerImage" />
            </Field>
            <Row>
              <Field label="Base colour">
                <ColorInput value={ctx.get('emails.baseColor')} onChange={(v) => ctx.set('emails.baseColor', v)} />
              </Field>
              <Field label="Background">
                <ColorInput value={ctx.get('emails.backgroundColor')} onChange={(v) => ctx.set('emails.backgroundColor', v)} />
              </Field>
            </Row>
            <Row>
              <Field label="Body background">
                <ColorInput value={ctx.get('emails.bodyColor')} onChange={(v) => ctx.set('emails.bodyColor', v)} />
              </Field>
              <Field label="Body text">
                <ColorInput value={ctx.get('emails.textColor')} onChange={(v) => ctx.set('emails.textColor', v)} />
              </Field>
            </Row>
            {ctx.get('brand.primaryColor') && (
              <Button kind="ghost" onClick={() => ctx.set('emails.baseColor', ctx.get('brand.primaryColor'))}>
                Use my brand colour
              </Button>
            )}
            <Field label="Footer text" help="{site_title} is replaced with your store name.">
              <TextArea rows={2} value={ctx.get('emails.footerText')} onChange={(v) => ctx.set('emails.footerText', v)} />
            </Field>
            <Field label="Send yourself a test">
              <TestSend ctx={ctx} />
            </Field>
          </div>
          <EmailPreview ctx={ctx} />
        </div>
      ),
    },
    {
      id: 'notifications',
      title: 'Which emails go out?',
      description: 'Order emails keep customers informed and you on top of new orders.',
      render: (ctx) => (
        <>
          {(['admin', 'customer'] as const).map((to) => (
            <fieldset key={to} className="ss-section">
              <legend>{to === 'admin' ? 'Emails to you' : 'Emails to customers'}</legend>
              {EMAIL_NOTIFICATIONS.filter((n) => n.to === to).map((n) => (
                <div key={n.key} className="ss-notify">
                  <Toggle
                    label={n.label}
                    help={n.description}
                    checked={ctx.get(`emails.notifications.${n.key}.enabled`) !== false}
                    onChange={(v) => ctx.set(`emails.notifications.${n.key}.enabled`, v)}
                  />
                  {to === 'admin' && ctx.get(`emails.notifications.${n.key}.enabled`) !== false && (
                    <TextInput
                      value={ctx.get(`emails.notifications.${n.key}.recipient`)}
                      placeholder={ctx.state.userEmail ?? 'you@yourstore.com'}
                      onChange={(v) => ctx.set(`emails.notifications.${n.key}.recipient`, v)}
                    />
                  )}
                </div>
              ))}
            </fieldset>
          ))}
        </>
      ),
    },
  ],
}
