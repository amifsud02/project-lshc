'use client'

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { SetupClientState } from '../../types'
import type { WizardId } from '../../wizards'

// Path helpers for the settings draft ("payments.bacs.enabled").

export const getIn = (obj: any, path: string): any => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj)

export const setIn = (obj: any, path: string, value: unknown): any => {
  const [head, ...rest] = path.split('.')
  const base = obj && typeof obj === 'object' ? obj : {}
  return { ...base, [head]: rest.length ? setIn(base[head], rest.join('.'), value) : value }
}

/** Merges plain objects; arrays and other values in `b` replace those in `a`. */
export const mergeDeep = (a: any, b: any): any => {
  if (!b || typeof b !== 'object' || Array.isArray(b) || !a || typeof a !== 'object' || Array.isArray(a)) return b === undefined ? a : b
  const out = { ...a }
  for (const [k, v] of Object.entries(b)) out[k] = mergeDeep(a[k], v)
  return out
}

// API.

export type Api = {
  get: <T = any>(path: string) => Promise<T>
  post: <T = any>(path: string, body: unknown) => Promise<T>
}

export const createApi = (apiRoute: string): Api => {
  const call = async (path: string, init?: RequestInit) => {
    const res = await fetch(`${apiRoute}/store-setup${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...init,
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(json.error || json.errors?.[0]?.message || `Request failed (${res.status})`)
    return json
  }
  return {
    get: (path) => call(path),
    post: (path, body) => call(path, { method: 'POST', body: JSON.stringify(body) }),
  }
}

// Wizard definitions.

export type StepContext = {
  draft: Record<string, any>
  get: (path: string) => any
  set: (path: string, value: unknown) => void
  state: SetupClientState
  setState: (state: SetupClientState) => void
  api: Api
  /** Scratch values for a step that are not settings (e.g. a product being typed in). */
  local: Record<string, any>
  setLocal: (key: string, value: unknown) => void
}

export type StepDef = {
  id: string
  title: string
  description?: string
  /** Hide the step when it does not apply, e.g. platform questions for brand-new stores. */
  when?: (ctx: StepContext) => boolean
  render: (ctx: StepContext) => ReactNode
  /** Return an error message to block "Continue". */
  validate?: (ctx: StepContext) => string | null | undefined
  /** Extra work on "Continue" after the settings patch is saved (create records, etc.). */
  onContinue?: (ctx: StepContext) => Promise<void>
  /** Label for the primary button. */
  cta?: string | ((ctx: StepContext) => string)
  /** Show "Skip this step". Skipping saves nothing for the step. */
  skippable?: boolean
}

export type WizardDef = {
  id: WizardId
  /** Top-level settings sections this wizard edits; only these are sent on save. */
  sections: string[]
  steps: StepDef[]
  /** Settings changes applied when the wizard finishes (e.g. stamping a completion date). */
  finishPatch?: (ctx: StepContext) => Record<string, any>
  /** The final "all done" message. */
  doneMessage?: (ctx: StepContext) => ReactNode
}

// Shared app state.

type SetupContextValue = {
  state: SetupClientState
  setState: (state: SetupClientState) => void
  api: Api
  navigate: (wizard?: string) => void
}

export const SetupContext = createContext<SetupContextValue | null>(null)

export const useSetup = () => {
  const ctx = useContext(SetupContext)
  if (!ctx) throw new Error('useSetup outside SetupContext')
  return ctx
}

/** Builds a StepContext around a local draft of the settings. */
export const useStepContext = (state: SetupClientState, setState: (s: SetupClientState) => void, api: Api) => {
  const [draft, setDraft] = useState<Record<string, any>>(() => structuredClone(state.settings))
  const [local, setLocalState] = useState<Record<string, any>>({})
  return useMemo<StepContext>(
    () => ({
      draft,
      get: (path) => getIn(draft, path),
      set: (path, value) => setDraft((d) => setIn(d, path, value)),
      state,
      setState,
      api,
      local,
      setLocal: (key, value) => setLocalState((l) => ({ ...l, [key]: value })),
    }),
    [draft, local, state, setState, api],
  )
}
