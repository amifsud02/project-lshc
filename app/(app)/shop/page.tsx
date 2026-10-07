import PageHeader from '@/components/PageHeader/PageHeader'
import { getActiveProducts } from '@/lib/shop/products'
import ProductCard from '@/components/Shop/ProductCard'
import { Card, CardContent } from '@/components/ui/card'

export const metadata = { title: 'Shop | La Salle Handball' }

export default async function ShopPage() {
  const products = await getActiveProducts()
  const now = new Date()
  const season = `${now.getFullYear()}/${String((now.getFullYear() + 1) % 100).padStart(2, '0')}`

  return (
    <>
      <PageHeader pageName="Shop" />
      <section className="parent">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-semibold text-foreground">The collection</h2>
            <p className="max-w-2xl text-base text-muted-foreground">
              Memberships, kit and bundles worn on and off the court. Every purchase supports the
              next generation of La Salle handball.
            </p>
            <p className="pt-1 text-sm font-medium text-muted-foreground">
              Season {season} · {products.length} item{products.length === 1 ? '' : 's'}
            </p>
          </div>

          {products.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Restocking
                </p>
                <h3 className="text-xl font-semibold">The shop is being prepared</h3>
                <p className="text-muted-foreground">
                  New kit and memberships will be published here soon. Check back shortly.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
