'use client'

import { useState, useSyncExternalStore } from 'react'
import { COMING_SOON_SCOPES, VISIBILITY_MODES } from '../../../reference'
import { WIZARDS } from '../../../wizards'
import { Badge, Button, Callout, ChoiceCards, Field, TextArea } from '../controls'
import { useSetup, type StepContext, type WizardDef } from '../engine'

function Checklist({ ctx }: { ctx: StepContext }) {
  const { navigate } = useSetup()
  const rows = WIZARDS.filter((w) => w.group === 'essential' && w.id !== 'launch').map((w) => ({ w, t: ctx.state.tasks.find((t) => t.id === w.id)! }))
  const open = rows.filter((r) => r.t.visible && !r.t.complete)
  return (
    <div className="ss-stack">
      {open.length === 0 ? (
        <Callout tone="success">Everything essential is done. You’re ready to launch.</Callout>
      ) : (
        <Callout tone="warning">
          {open.length} essential task{open.length === 1 ? ' is' : 's are'} still open. You can launch anyway, but customers may hit gaps.
        </Callout>
      )}
      <ul className="ss-checklist">
        {rows
          .filter((r) => r.t.visible)
          .map(({ w, t }) => (
            <li key={w.id} className={t.complete ? 'is-done' : ''}>
              <span className="ss-checklist__mark" aria-hidden>
                {t.complete ? '✓' : '•'}
              </span>
              <span>{t.complete ? w.doneTitle : w.title}</span>
              {t.skipped && <Badge tone="warning">Skipped</Badge>}
              {!t.complete && (
                <Button kind="ghost" onClick={() => navigate(w.id)}>
                  Finish
                </Button>
              )}
            </li>
          ))}
      </ul>
    </div>
  )
}

function PreviewLink({ ctx }: { ctx: StepContext }) {
  const [copied, setCopied] = useState(false)
  // Empty on the server, so the server render and hydration agree.
  const origin = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => '',
  )
  const token: string | undefined = ctx.state.settings.visibility?.previewToken
  const url = token ? `${origin}/?store-preview=${token}` : null
  return (
    <Field label="Private preview link" help="Anyone with this link can see the store while it is coming soon — handy for clients, testers and friends.">
      {url ? (
        <span className="ss-copy">
          <code>{url}</code>
          <Button
            kind="secondary"
            onClick={async () => {
              await navigator.clipboard.writeText(url)
              setCopied(true)
            }}
          >
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </span>
      ) : (
        <Button
          kind="secondary"
          onClick={async () => ctx.setState(await ctx.api.post('/launch', { mode: ctx.state.settings.visibility?.mode ?? 'coming_soon' }))}
        >
          Create a preview link
        </Button>
      )}
    </Field>
  )
}

const mode = (ctx: StepContext): string => ctx.local.mode ?? ctx.state.settings.visibility?.mode ?? 'coming_soon'

export const launchWizard: WizardDef = {
  id: 'launch',
  sections: [],
  steps: [
    {
      id: 'review',
      title: 'Before you launch',
      description: 'A last look at your essentials.',
      render: (ctx) => <Checklist ctx={ctx} />,
    },
    {
      id: 'visibility',
      title: 'Who can see your store?',
      description: 'New stores start as “coming soon”. Staff always see the real store.',
      render: (ctx) => (
        <>
          <ChoiceCards columns={2} options={VISIBILITY_MODES} value={mode(ctx)} onChange={(v) => ctx.setLocal('mode', v)} />
          {mode(ctx) === 'coming_soon' && (
            <>
              <Field label="While coming soon, hide">
                <ChoiceCards options={COMING_SOON_SCOPES} value={ctx.local.scope ?? ctx.state.settings.visibility?.scope ?? 'store'} onChange={(v) => ctx.setLocal('scope', v)} />
              </Field>
              <Field label="Coming soon message">
                <TextArea rows={3} value={ctx.local.message ?? ctx.state.settings.visibility?.message} onChange={(v) => ctx.setLocal('message', v)} />
              </Field>
            </>
          )}
          <PreviewLink ctx={ctx} />
        </>
      ),
      cta: (ctx) => (mode(ctx) === 'live' ? 'Launch my store' : 'Keep it coming soon'),
      onContinue: async (ctx) => {
        ctx.setState(await ctx.api.post('/launch', { mode: mode(ctx), scope: ctx.local.scope, message: ctx.local.message }))
      },
    },
  ],
  doneMessage: (ctx) =>
    mode(ctx) === 'live'
      ? 'Congratulations — your store is live! Share it, place a test order, and keep going with the next steps.'
      : 'Your store stays in coming soon mode. Come back here when you’re ready to go live.',
}
