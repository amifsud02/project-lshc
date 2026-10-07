import Link from 'next/link'
import PageHeader from '@/components/PageHeader/PageHeader'
import { getPayload } from 'payload'
import config from '@payload-config'
import ClearCartOnMount from './ClearCartOnMount'
import OrderReceipt, { type ReceiptLine } from '@/components/Shop/OrderReceipt'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export const metadata = { title: 'Order confirmed | La Salle Handball' }

type SearchParams = Promise<{ session_id?: string }>

export default async function SuccessPage({ searchParams }: { searchParams: SearchParams }) {
  const { session_id: sessionId } = await searchParams

  let order: any = null
  if (sessionId) {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'orders',
      where: { stripeCheckoutSessionId: { equals: sessionId } },
      limit: 1,
      overrideAccess: true,
    })
    order = docs[0] ?? null
  }

  const lines: ReceiptLine[] = (order?.items ?? []).map((it: any) => ({
    title: it.productTitle,
    quantity: it.quantity ?? 1,
    lineTotal: (it.unitPrice ?? 0) * (it.quantity ?? 1),
    isChild: Boolean(it.bundleParentLineId),
  }))

  return (
    <>
      <PageHeader pageName="Order confirmed" />
      <section className="parent">
        <ClearCartOnMount />
        <div className="mx-auto flex max-w-2xl flex-col gap-6">
          <p className="text-base text-muted-foreground">
            Your support means the world to the club. A receipt has been sent to your email — you
            can close this page safely.
          </p>

          {order ? (
            <OrderReceipt
              orderNumber={order.orderNumber}
              email={order.customerEmail}
              statusLabel="Paid"
              paid
              dateLabel={new Date().toLocaleDateString('en-MT', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
              lines={lines}
              total={order.total}
              actions={
                <>
                  <Button render={<Link href="/shop" />}>Continue shopping</Button>
                  <Button variant="outline" render={<Link href="/account" />}>
                    View orders
                  </Button>
                </>
              }
            />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-start gap-3">
                <Badge variant="secondary" className="rounded-full px-3 py-0.5">
                  Processing
                </Badge>
                <p className="text-lg font-semibold">We&apos;re confirming your payment…</p>
                <p className="text-sm text-muted-foreground">
                  If this page doesn&apos;t update in a moment, check your email for the receipt.
                </p>
                <Button render={<Link href="/shop" />}>Continue shopping</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </>
  )
}
