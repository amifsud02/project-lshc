'use client'

import { useState } from 'react'
import { wizardById, WIZARDS } from '../../wizards'
import { Button } from './controls'
import { mergeDeep, useSetup, useStepContext, type WizardDef } from './engine'

export function WizardRunner({ def }: { def: WizardDef }) {
  const { state, setState, api, navigate } = useSetup()
  const ctx = useStepContext(state, setState, api)
  const meta = wizardById(def.id)!
  const steps = def.steps.filter((s) => !s.when || s.when(ctx))
  const [index, setIndex] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [finished, setFinished] = useState(false)
  const step = steps[Math.min(index, steps.length - 1)]
  const last = index >= steps.length - 1

  const patch = () => Object.fromEntries(def.sections.map((key) => [key, ctx.draft[key]]))

  const advance = async (skip = false) => {
    setError(null)
    if (!skip) {
      const problem = step.validate?.(ctx)
      if (problem) return setError(problem)
    }
    setBusy(true)
    try {
      if (!skip) {
        // Records first, so a failed create doesn't leave the task marked complete.
        await step.onContinue?.(ctx)
        const body = last ? { patch: mergeDeep(patch(), def.finishPatch?.(ctx) ?? {}), complete: def.id } : { patch: patch() }
        setState(await api.post('/settings', body))
      }
      if (last) {
        if (skip) setState(await api.post('/settings', { patch: def.finishPatch?.(ctx) ?? {}, complete: def.id }))
        setFinished(true)
      } else {
        setIndex(index + 1)
      }
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  if (finished) {
    const next = WIZARDS.find((w) => {
      const t = state.tasks.find((x) => x.id === w.id)
      return w.id !== def.id && t?.visible && !t.complete && !t.skipped
    })
    return (
      <div className="ss-done">
        <div className="ss-done__mark" aria-hidden>
          ✓
        </div>
        <h2>{meta.doneTitle}</h2>
        <div className="ss-done__text">{def.doneMessage?.(ctx) ?? 'Saved. You can change any of this later under Store Settings.'}</div>
        <div className="ss-done__actions">
          {next && <Button onClick={() => navigate(next.id)}>Next: {next.title}</Button>}
          <Button kind="secondary" onClick={() => navigate()}>
            Back to store setup
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="ss-wizard">
      <aside className="ss-rail">
        <button type="button" className="ss-rail__back" onClick={() => navigate()}>
          ← Store setup
        </button>
        <h2 className="ss-rail__title">{meta.title}</h2>
        <ol className="ss-rail__steps">
          {steps.map((s, i) => (
            <li key={s.id} className={i === index ? 'is-current' : i < index ? 'is-done' : ''}>
              <button type="button" disabled={i > index} onClick={() => i < index && setIndex(i)}>
                <span className="ss-rail__dot">{i < index ? '✓' : i + 1}</span>
                {s.title}
              </button>
            </li>
          ))}
        </ol>
        <p className="ss-rail__time">About {meta.minutes} min</p>
      </aside>

      <section className="ss-panel" key={step.id}>
        <header className="ss-panel__head">
          <span className="ss-eyebrow">
            Step {index + 1} of {steps.length}
          </span>
          <h1>{step.title}</h1>
          {step.description && <p>{step.description}</p>}
        </header>
        <div className="ss-panel__body">{step.render(ctx)}</div>
        {error && (
          <div className="ss-callout ss-callout--warning" role="alert">
            {error}
          </div>
        )}
        <footer className="ss-panel__foot">
          <div>
            {index > 0 && (
              <Button kind="ghost" onClick={() => setIndex(index - 1)} disabled={busy}>
                Back
              </Button>
            )}
          </div>
          <div className="ss-panel__foot-right">
            {step.skippable && (
              <Button kind="ghost" onClick={() => advance(true)} disabled={busy}>
                Skip this step
              </Button>
            )}
            <Button onClick={() => advance()} disabled={busy}>
              {busy ? 'Saving…' : ((typeof step.cta === 'function' ? step.cta(ctx) : step.cta) ?? (last ? 'Finish' : 'Continue'))}
            </Button>
          </div>
        </footer>
      </section>
    </div>
  )
}
