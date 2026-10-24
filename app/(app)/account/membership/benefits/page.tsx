import Link from 'next/link'
import { redirect } from 'next/navigation'
import { BadgeCheck } from 'lucide-react'
import PartnerList from '@/components/Memberships/PartnerList'
import { getUserCurrentMemberships } from '@/lib/account/data'
import { getCurrentUser } from '@/lib/auth/server'
import { getMembrsPartners, withoutCodes, type MembrsPartner } from '@/lib/membrs/client'

export const metadata = { title: 'Member benefits' }

const titleOf = (value: unknown) =>
  value && typeof value === 'object' ? ((value as { title?: string }).title ?? '') : ''

/** Every partner's offers, with the codes when the signed-in user has a current membership. */
export default async function AccountMembershipBenefitsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?redirect=/account/membership/benefits')

  const memberships = await getUserCurrentMemberships(user)
  const isMember = memberships.length > 0

  let partners: MembrsPartner[] | null = null
  try {
    const all = await getMembrsPartners(300)
    partners = isMember ? all : withoutCodes(all)
  } catch (err) {
    console.error('[membrs] failed to load partners', err)
  }

  return (
    <>
      <h2 className="account-title">Member benefits</h2>
      {isMember ? (
        <>
          <p className="account-lead">
            Show your digital membership card at the till to get your discount. Where a partner gives members a code,
            it&apos;s shown with the offer.
          </p>
          <ul className="mb-8 flex flex-col gap-2">
            {memberships.map((m) => (
              <li key={m.id} className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
                <BadgeCheck className="size-5 shrink-0 text-primary" />
                <span className="flex flex-col">
                  <span className="text-sm font-semibold">{titleOf(m.product) || `Membership ${m.season}`}</span>
                  <span className="text-sm text-muted-foreground">
                    {m.fullName} · Season {m.season}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="account-empty mb-8">
          <p className="account-empty__title">You don&apos;t have a membership for this season</p>
          <p className="account-empty__body">
            Memberships bought for {user.email} show here with their discount codes.
          </p>
          <Link href="/memberships" className="account-inline-link">
            Become a member
          </Link>
        </div>
      )}

      {partners === null ? (
        <p className="account-lead">Partner discounts can&apos;t be shown right now. Please try again later.</p>
      ) : partners.length === 0 ? (
        <p className="account-lead">Partner discounts for this season will be announced soon.</p>
      ) : (
        <PartnerList partners={partners} members={isMember} columns={2} />
      )}
    </>
  )
}
