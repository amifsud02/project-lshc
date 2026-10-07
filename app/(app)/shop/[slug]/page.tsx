import Link from 'next/link'
import { notFound } from 'next/navigation'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { Check, Home, ChevronRight, Lock, ShieldCheck } from 'lucide-react'
import PageHeader from '@/components/PageHeader/PageHeader'
import AddToCartButton from '@/components/Shop/AddToCartButton'
import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { getProductBySlug } from '@/lib/shop/products'
import { formatPrice } from '@/lib/shop/types'

export const revalidate = 60

type Params = Promise<{ slug: string }>

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return { title: 'Product not found' }
  return { title: `${product.title} | Club Shop` }
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product || !product.active) notFound()

  const included = product.unitTemplates.filter((t) => t.productId !== product.id)

  return (
    <>
      <PageHeader pageName={product.title} />
      <section className="parent">
        <div className="flex flex-col gap-6 lg:gap-8">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href="/" />}>
                  <Home className="size-4" />
                  <span className="sr-only">Home</span>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronRight className="size-4" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href="/shop" />}>Shop</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronRight className="size-4" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbPage>{product.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-7">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted">
                {product.imageUrl ? (
                  <div
                    className="size-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${product.imageUrl})` }}
                    role="img"
                    aria-label={product.title}
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary to-foreground text-6xl font-extrabold tracking-wide text-primary-foreground/80">
                    LS
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="sticky top-8 flex flex-col gap-6 rounded-2xl border bg-card p-6 md:p-8">
                <div className="flex flex-col gap-3">
                  <Badge variant="secondary" className="w-fit rounded-full px-3 py-0.5">
                    {product.type === 'membership'
                      ? `Membership ${product.membership?.season ?? ''}`.trim()
                      : product.type === 'bundle'
                        ? 'Club bundle'
                        : 'Club item'}
                  </Badge>
                  <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                    {product.title}
                  </h2>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-semibold">{formatPrice(product.price)}</span>
                    <span className="text-sm text-muted-foreground">All in · VAT incl.</span>
                  </div>
                </div>

                {product.description ? (
                  <div className="text-base leading-relaxed text-muted-foreground [&_a]:text-primary [&_a]:underline [&_li]:mb-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5">
                    <RichText data={product.description as any} />
                  </div>
                ) : null}

                {product.type !== 'single' && included.length > 0 && (
                  <div className="flex flex-col gap-3 rounded-xl bg-muted/60 p-4">
                    <p className="text-sm font-semibold text-foreground">What&apos;s included</p>
                    <ul className="flex flex-col gap-2">
                      {included.map((t, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                          <Check className="size-4 shrink-0 text-primary" />
                          {t.productTitle}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Separator />

                <AddToCartButton product={product} />

                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <Lock className="size-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Secure payment by Stripe</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="size-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Receipt sent to your email</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
