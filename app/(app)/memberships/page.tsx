import Link from 'next/link'
import { ArrowRight, BadgePercent } from 'lucide-react'
import PageHeader from '@/components/PageHeader/PageHeader'
import ProductCard from '@/components/Shop/ProductCard'
import { Card, CardContent } from '@/components/ui/card'
import { getMembrsPartners } from '@/lib/membrs/client'
import { getActiveProducts } from '@/lib/shop/products'
import { requireShopCatalogueAccess } from '@/lib/shop/access'

export const revalidate = 60

export const metadata = {
  title: 'Memberships',
  description: 'Become a La Salle Handball Club member and get discounts with our partners across Malta.',
  alternates: { canonical: '/memberships' },
}

/** The shop's memberships on their own page. Buying one happens on its product page. */
export default async function MembershipsPage() {
  await requireShopCatalogueAccess()
  const memberships = (await getActiveProducts()).filter((p) => p.type === 'membership')
  const partnerCount = await getMembrsPartners(300)
    .then((partners) => partners.length)
    .catch(() => 0)
  const seasons = [...new Set(memberships.map((m) => m.membership?.season).filter(Boolean))]

  return (
    <>
      <PageHeader pageName="Memberships" />
      <section className="parent">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-semibold text-foreground">Become a member</h2>
            <p className="max-w-2xl text-base text-muted-foreground">
              Every membership helps fund our teams, from the nursery to the senior squads, and comes with a
              digital membership card that gets you discounts with the club&apos;s partners.
            </p>
            {seasons.length > 0 && (
              <p className="pt-1 text-sm font-medium text-muted-foreground">Season {seasons.join(', ')}</p>
            )}
          </div>

          <Link href="/membership/benefits" className="group">
            <Card className="transition-colors group-hover:bg-muted/60">
              <CardContent className="flex items-center gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <BadgePercent className="size-5" />
                </span>
                <div className="flex flex-1 flex-col">
                  <span className="text-base font-semibold text-foreground">
                    {partnerCount > 0
                      ? `Member discounts at ${partnerCount} partner businesses`
                      : 'Member discounts with our partners'}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Restaurants, cafés, attractions, shops and more across Malta.
                  </span>
                </div>
                <span className="hidden items-center gap-1 text-sm font-medium text-primary sm:inline-flex">
                  See the benefits
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </CardContent>
            </Card>
          </Link>

          {memberships.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                <h3 className="text-xl font-semibold">Memberships aren&apos;t on sale yet</h3>
                <p className="text-muted-foreground">Next season&apos;s memberships will be published here soon.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {memberships.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
