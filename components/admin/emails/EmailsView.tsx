import type { AdminViewServerProps } from 'payload'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'
import { redirect } from 'next/navigation'
import { hasRole } from '@/lib/auth/roles'
import { SHOP_EMAILS } from '@/lib/email/shopEmails'
import { EmailTester } from './EmailTester'

/** /admin/emails: preview every shop email with a real or sample order and send a test copy. */
export async function EmailsView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, permissions, visibleEntities, locale } = initPageResult
  if (!req.user) redirect('/admin/login?redirect=%2Fadmin%2Femails')
  const allowed = hasRole(req.user as any, 'admin', 'shop-manager')

  const { docs } = allowed
    ? await req.payload.find({
        collection: 'orders',
        where: { status: { in: ['paid', 'ready', 'shipped', 'fulfilled', 'refunded'] } },
        sort: '-createdAt',
        limit: 25,
        depth: 0,
        select: { orderNumber: true, customerName: true, customerEmail: true, total: true, status: true },
      })
    : { docs: [] }

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
      <Gutter>
        <div style={{ padding: '32px 0 64px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <h1 style={{ margin: 0 }}>Email templates</h1>
            <p style={{ margin: '6px 0 0', color: 'var(--theme-elevation-500)' }}>
              See each shop email as buyers and staff get it, using a real order or sample data, and send yourself a test copy.
            </p>
          </div>
          {allowed ? (
            <EmailTester
              templates={Object.entries(SHOP_EMAILS).map(([kind, t]) => ({ kind, ...t }))}
              orders={docs.map((o: any) => ({
                id: String(o.id),
                label: `${o.orderNumber} · ${o.customerName || o.customerEmail} · ${o.status}`,
              }))}
              defaultTo={String(req.user?.email ?? '')}
            />
          ) : (
            <p>Only admins and shop managers can use this page.</p>
          )}
        </div>
      </Gutter>
    </DefaultTemplate>
  )
}
