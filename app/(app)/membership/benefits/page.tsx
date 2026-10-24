import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import PageHeader from '@/components/PageHeader/PageHeader'
import PartnerList from '@/components/Memberships/PartnerList'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ACCOUNTS_ENABLED } from '@/lib/features'
import { getMembrsPartners, withoutCodes, type MembrsPartner } from '@/lib/membrs/client'
import { cn } from '@/lib/utils'
import { getGeneralGlobal } from '@/lib/utils/payload/globals'

export const revalidate = 300

export const metadata = {
  title: 'Member benefits',
  description: "Discounts La Salle Handball Club members get with the club's partners across Malta.",
  alternates: { canonical: '/membership/benefits' },
}

/**
 * Every partner business and what members get there, from MEMBRS. Codes are taken out here:
 * members see them in their account (/account/membership/benefits).
 */
export default async function MembershipBenefitsPage() {
  let partners: MembrsPartner[] | null = null
  try {
    partners = withoutCodes(await getMembrsPartners(revalidate))
  } catch (err) {
    console.error('[membrs] failed to load partners', err)
  }
  // Memberships are bought through the shop, so only point there when it's open.
  const shopIsPublic = (await getGeneralGlobal()).shopVisibility === 'public'

  return (
    <>
      <PageHeader pageName="Member benefits" />
      <section className="parent">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-semibold text-foreground">
                {partners?.length ? `Discounts at ${partners.length} partner businesses` : 'Discounts with our partners'}
              </h2>
              <p className="max-w-2xl text-base text-muted-foreground">
                Show your digital membership card at the till to get your discount. Some partners give members a code
                to use online instead.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {shopIsPublic && (
                <Link href="/memberships" className={cn(buttonVariants({ size: 'lg' }), 'rounded-lg')}>
                  Become a member
                  <ArrowRight />
                </Link>
              )}
              {ACCOUNTS_ENABLED && (
                <Link
                  href="/account/membership/benefits"
                  className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'rounded-lg')}
                >
                  Members: see your codes
                </Link>
              )}
            </div>
          </div>

          {partners === null ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Partner discounts can&apos;t be shown right now. Please try again later.
              </CardContent>
            </Card>
          ) : partners.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Partner discounts for this season will be announced soon.
              </CardContent>
            </Card>
          ) : (
            <PartnerList partners={partners} />
          )}
        </div>
      </section>
    </>
  )
}
