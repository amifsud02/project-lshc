import { DefaultTemplate } from '@payloadcms/next/templates'
import { redirect } from 'next/navigation'
import type { AdminViewServerProps } from 'payload'
import { patchSettings } from '../endpoints'
import { buildClientState, canManageStore, resolvedOptions } from '../server'
import { wizardById } from '../wizards'
import { SetupApp } from './client/SetupApp'

/** /admin/store-setup (the hub) and /admin/store-setup/<wizard-id>. */
export async function SetupView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, permissions, visibleEntities, locale } = initPageResult
  const { routes } = req.payload.config
  if (!req.user) redirect(`${routes.admin}/login?redirect=${encodeURIComponent(`${routes.admin}/store-setup`)}`)
  const opts = resolvedOptions(req.payload)
  const allowed = await canManageStore(req, opts)

  const segments = ((params as { segments?: string[] } | undefined)?.segments ?? []) as string[]
  const wizard = segments[1] && wizardById(segments[1]) ? segments[1] : undefined

  let state = allowed ? await buildClientState(req, opts) : null
  // Opening setup counts as the first run, so the dashboard stops redirecting here.
  if (state && !state.settings.setup?.firstRunDone) {
    state = { ...state, settings: await patchSettings(req, opts, { setup: { firstRunDone: true } }) }
  }

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={req.payload}
      permissions={permissions}
      req={req}
      searchParams={searchParams}
      user={req.user || undefined}
      visibleEntities={visibleEntities}
    >
      {state ? <SetupApp initialState={state} wizard={wizard} /> : <p style={{ padding: 48 }}>You don’t have access to store setup.</p>}
    </DefaultTemplate>
  )
}
