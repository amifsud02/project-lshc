'use client'

import { useState } from 'react'
import { countryName } from '../../reference'
import { WIZARDS, type WizardMeta } from '../../wizards'
import { Badge, Button } from './controls'
import { useSetup } from './engine'

function ProgressRing({ done, total }: { done: number; total: number }) {
  const r = 34
  const c = 2 * Math.PI * r
  const pct = total ? done / total : 0
  return (
    <svg className="ss-ring" width="84" height="84" viewBox="0 0 84 84" role="img" aria-label={`${done} of ${total} done`}>
      <circle cx="42" cy="42" r={r} className="ss-ring__track" />
      <circle cx="42" cy="42" r={r} className="ss-ring__fill" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} />
      <text x="42" y="47" textAnchor="middle">
        {done}/{total}
      </text>
    </svg>
  )
}

export function Hub() {
  const { state, setState, api, navigate } = useSetup()
  const [busy, setBusy] = useState<string | null>(null)
  const task = (id: string) => state.tasks.find((t) => t.id === id)!
  const visible = (w: WizardMeta) => task(w.id).visible
  const essential = WIZARDS.filter((w) => w.group === 'essential' && visible(w))
  const extended = WIZARDS.filter((w) => w.group === 'extended' && visible(w))
  const doneCount = essential.filter((w) => task(w.id).complete).length
  const allDone = doneCount === essential.length
  const hidden = Boolean(state.settings.setup?.taskListHidden)
  const p = state.settings.profile ?? {}
  const nextUp = essential.find((w) => !task(w.id).complete && !task(w.id).skipped)

  const act = async (id: string, action: 'skip' | 'reopen') => {
    setBusy(id)
    try {
      setState(await api.post('/task', { id, action }))
    } finally {
      setBusy(null)
    }
  }
  const toggleHidden = async () => setState(await api.post('/task-list', { hidden: !hidden }))

  return (
    <div className="ss-hub">
      <header className="ss-hub__head">
        <div>
          <span className="ss-eyebrow">Store setup</span>
          <h1>{allDone ? 'Your store is ready' : p.storeName ? `Let’s get ${p.storeName} ready to sell` : 'Let’s get your store ready to sell'}</h1>
          <p>
            {allDone
              ? 'Every essential task is done. Keep improving with the next steps below.'
              : 'Work through the essentials in any order. Each wizard saves as you go, so you can stop and come back.'}
          </p>
          {(p.industry || state.settings.general?.country) && (
            <p className="ss-hub__meta">
              {[state.settings.currency?.code, countryName(state.settings.general?.country), p.storeName].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
        <ProgressRing done={doneCount} total={essential.length} />
      </header>

      {hidden ? (
        <div className="ss-callout ss-callout--info ss-hub__hidden">
          The task list is hidden. <Button kind="ghost" onClick={toggleHidden}>Show it again</Button>
        </div>
      ) : (
        <>
          <section className="ss-tasks">
            <div className="ss-tasks__head">
              <h2>Get ready to sell</h2>
              <Button kind="ghost" onClick={toggleHidden}>
                Hide this
              </Button>
            </div>
            <ol>
              {essential.map((w, i) => {
                const t = task(w.id)
                const isNext = nextUp?.id === w.id
                return (
                  <li key={w.id} className={`ss-task${t.complete ? ' is-done' : ''}${isNext ? ' is-next' : ''}${t.skipped ? ' is-skipped' : ''}`}>
                    <span className="ss-task__num" aria-hidden>
                      {t.complete ? '✓' : i + 1}
                    </span>
                    <button type="button" className="ss-task__main" onClick={() => navigate(w.id)}>
                      <strong>{t.complete ? w.doneTitle : w.id === 'products' && p.setupFor === 'selling' ? 'Import your products' : w.title}</strong>
                      <small>{w.description}</small>
                    </button>
                    <span className="ss-task__side">
                      {t.skipped && <Badge tone="warning">Skipped</Badge>}
                      {!t.complete && !t.skipped && <span className="ss-task__time">{w.minutes} min</span>}
                      {!t.complete && w.skippable && !t.skipped && (
                        <Button kind="ghost" disabled={busy === w.id} onClick={() => act(w.id, 'skip')}>
                          Skip
                        </Button>
                      )}
                      {t.skipped && (
                        <Button kind="ghost" disabled={busy === w.id} onClick={() => act(w.id, 'reopen')}>
                          Undo
                        </Button>
                      )}
                      {isNext && <Button onClick={() => navigate(w.id)}>Start</Button>}
                    </span>
                  </li>
                )
              })}
            </ol>
          </section>

          <section className="ss-next">
            <h2>Things to do next</h2>
            <div className="ss-next__grid">
              {extended.map((w) => {
                const t = task(w.id)
                return (
                  <button type="button" key={w.id} className={`ss-tile${t.complete ? ' is-done' : ''}`} onClick={() => navigate(w.id)}>
                    <span className="ss-tile__top">
                      <strong>{t.complete ? w.doneTitle : w.title}</strong>
                      {t.complete ? <Badge tone="success">Done</Badge> : t.skipped ? <Badge tone="warning">Skipped</Badge> : <span className="ss-task__time">{w.minutes} min</span>}
                    </span>
                    <small>{w.description}</small>
                  </button>
                )
              })}
            </div>
          </section>
        </>
      )}

      <footer className="ss-hub__foot">
        <a href={`${state.adminRoute}/globals/${state.slugs.settings}`}>Open all store settings</a>
        <span>·</span>
        <a href={`${state.adminRoute}/collections/${state.productsCollection}`}>Products ({state.counts.products})</a>
        <span>·</span>
        <a href={`${state.adminRoute}/collections/${state.slugs.shippingZones}`}>Shipping zones</a>
        <span>·</span>
        <a href={`${state.adminRoute}/collections/${state.slugs.taxRates}`}>Tax rates</a>
        <span>·</span>
        <a href={`${state.adminRoute}/collections/${state.slugs.coupons}`}>Coupons</a>
      </footer>
    </div>
  )
}
