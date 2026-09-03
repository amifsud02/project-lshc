import Link from 'next/link'
import { redirect } from 'next/navigation'
import StatusBadge from '@/components/Account/StatusBadge'
import { getCurrentUser } from '@/lib/auth/server'
import { formatDate, getUserNurseryRegistrations, nurseryStatusLabels } from '@/lib/account/data'
import { formatPrice } from '@/lib/shop/types'

export const metadata = { title: 'Nursery registrations | La Salle Handball' }

const titleOf = (value: unknown): string => {
  if (value && typeof value === 'object') {
    const doc = value as { title?: string; name?: string; label?: string }
    return doc.title ?? doc.name ?? doc.label ?? ''
  }
  return ''
}

export default async function AccountNurseryPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?redirect=/account/nursery')

  const registrations = await getUserNurseryRegistrations(user)

  return (
    <>
      <h2 className="account-title">Nursery registrations</h2>
      <p className="account-lead">
        Children you have registered for the handball nursery, with the latest season first.
      </p>

      {registrations.length === 0 ? (
        <div className="account-empty">
          <p className="account-empty__title">No registrations yet</p>
          <p className="account-empty__body">
            Registrations made with this email address will appear here.
          </p>
          <Link href="/nursery" className="btn">
            About the nursery
          </Link>
        </div>
      ) : (
        <div className="account-table-wrap">
          <table className="account-table">
            <thead>
              <tr>
                <th scope="col">Registration</th>
                <th scope="col">Child</th>
                <th scope="col">Season</th>
                <th scope="col">Status</th>
                <th scope="col" className="is-num">Fee</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((reg) => {
                const child = [reg.child?.firstName, reg.child?.lastName].filter(Boolean).join(' ')
                const season = titleOf(reg.season)
                const category = titleOf(reg.category)
                return (
                  <tr key={reg.id}>
                    <td data-label="Registration">
                      <span style={{ fontWeight: 700 }}>#{reg.registrationNumber ?? reg.id.slice(-6).toUpperCase()}</span>
                      <span className="account-table__sub">{formatDate(reg.createdAt)}</span>
                    </td>
                    <td data-label="Child">
                      {child || reg.childName || '—'}
                      {reg.fee?.tierLabel ? (
                        <span className="account-table__sub">{reg.fee.tierLabel}</span>
                      ) : null}
                    </td>
                    <td data-label="Season">
                      {season || '—'}
                      {category ? <span className="account-table__sub">{category}</span> : null}
                    </td>
                    <td data-label="Status">
                      <StatusBadge status={reg.status} label={nurseryStatusLabels[reg.status]} />
                    </td>
                    <td data-label="Fee" className="is-num">
                      {typeof reg.fee?.priceCents === 'number' ? formatPrice(reg.fee.priceCents) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
