import Link from 'next/link'
import { ACCOUNTS_ENABLED } from '@/lib/features'
import PageHeader from '@/components/PageHeader/PageHeader'
import { getPayload } from 'payload'
import config from '@payload-config'
import ClearCartOnMount from './ClearCartOnMount'
import RefreshWhilePending from './RefreshWhilePending'
import OrderReceipt, { type ReceiptLine } from '@/components/Shop/OrderReceipt'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import TrackEvent from '@/components/Analytics/TrackEvent'
import { toGaItem } from '@/lib/analytics/gtag'
import { summarizeOrderFor } from '@/lib/shop/orderQuestions'
import { getGeneralGlobal } from '@/lib/utils/payload/globals'

export const metadata = { title: 'Order confirmed' }
export const dynamic = 'force-dynamic'

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

  // The order is only marked paid once the payment webhook arrives, which can lag the redirect.
  const confirmed = order && order.status !== 'pending'

  // Lines with their answers labelled ("Hoodie size: L"); a membership lists each member.
  const summary = order ? await summarizeOrderFor(await getPayload({ config }), order.items ?? []) : null
  const lines: ReceiptLine[] = summary
    ? [
        ...(summary.membership
          ? [
              { title: `${summary.membership.title} (${summary.membership.season})`, quantity: 1, lineTotal: summary.membership.price },
              ...summary.membership.members.flatMap((m) => [
                { title: m.name, quantity: 1, lineTotal: 0, isChild: true, fields: m.answers.map((a) => [a.label, a.value] as [string, string]) },
                ...m.items.map((it) => ({ title: it.title, quantity: it.quantity, lineTotal: 0, isChild: true, fields: it.answers.map((a) => [a.label, a.value] as [string, string]) })),
              ]),
            ]
          : []),
        ...summary.lines.map((l) => ({
          title: l.title,
          quantity: l.quantity,
          lineTotal: l.lineTotal,
          isChild: l.included,
          fields: l.answers.map((a) => [a.label, a.value] as [string, string]),
        })),
      ]
    : []
  // Anything charged on top of the items, e.g. the MEMBRS platform fee.
  const deliveryFee = order?.deliveryFee ?? 0
  const discount = order?.discountTotal ?? 0
  const taxAdded = order?.taxAdded ?? 0
  const extra = order ? (order.total ?? 0) - (order.subtotal ?? order.total ?? 0) - deliveryFee + discount - taxAdded : 0
  const adjustments: [string, number][] = [
    ...(deliveryFee > 0 ? [[order?.fulfilment?.methodTitle || 'Delivery', deliveryFee] as [string, number]] : []),
    ...(discount > 0 ? [[order?.couponCode ? `Coupon ${order.couponCode.toUpperCase()}` : 'Promo code', -discount] as [string, number]] : []),
    ...(taxAdded > 0 ? [['Tax', taxAdded] as [string, number]] : []),
    ...(extra > 0 ? [[order.paymentProvider === 'membrs' ? 'MEMBRS platform fee' : 'Other charges', extra] as [string, number]] : []),
  ]
  // What happens next depends on how the buyer chose to get the order.
  const { shop } = await getGeneralGlobal()
  const fulfilment = order?.fulfilment ?? {}
  const nextSteps =
    order?.paymentProvider === 'membrs'
      ? 'Your digital membership card arrives by email from MEMBRS.'
      : fulfilment.method === 'deliver'
        ? `We'll deliver to ${[fulfilment.addressLine1, fulfilment.locality].filter(Boolean).join(', ')}${shop.delivery.details ? ` (${shop.delivery.details})` : ''} and email you when it's on its way.`
        : `We'll email you when it's ready to collect${shop.collection.readyIn ? `, usually within ${shop.collection.readyIn}` : ''}. ${shop.collection.details} Bring your order number.`
  const paidOn = order?.paidAt
    ? new Intl.DateTimeFormat('en-MT', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Europe/Malta' }).format(new Date(order.paidAt))
    : undefined

  // Bundle contents are listed under their bundle, whose price already covers them.
  const gaItems = (order?.items ?? [])
    .filter((it: any) => !it.bundleParentLineId)
    .map((it: any) =>
      toGaItem({
        id: String(typeof it.product === 'object' ? it.product?.id : (it.product ?? it.productTitle)),
        title: it.productTitle,
        price: it.unitPrice ?? 0,
        quantity: it.quantity ?? 1,
      }),
    )

  return (
    <>
      <PageHeader pageName="Order confirmed" />
      <section className="parent">
        <ClearCartOnMount />
        {confirmed ? (
          <TrackEvent
            name="purchase"
            onceKey={`purchase:${order.orderNumber}`}
            params={{
              transaction_id: String(order.orderNumber),
              currency: String(order.currency ?? 'eur').toUpperCase(),
              value: (order.total ?? 0) / 100,
              items: gaItems,
            }}
          />
        ) : null}
        {!confirmed && <RefreshWhilePending />}
        <div className="mx-auto flex max-w-2xl flex-col gap-6">
          <p className="text-base text-muted-foreground">
            {confirmed
              ? 'Your support means the world to the club. A receipt has been sent to your email — you can close this page safely.'
              : "Your support means the world to the club. We'll email your receipt as soon as the payment clears."}
          </p>

          {confirmed ? (
            <OrderReceipt
              orderNumber={order.orderNumber}
              email={order.customerEmail}
              statusLabel="Paid"
              paid
              dateLabel={paidOn}
              lines={lines}
              subtotal={order.subtotal}
              adjustments={adjustments}
              total={order.total}
              vatIncluded={order.vatIncluded}
              details={[['What happens next', nextSteps]]}
              actions={
                <>
                  <Button render={<Link href="/shop" />}>Continue shopping</Button>
                  {ACCOUNTS_ENABLED ? (
                    <Button variant="outline" render={<Link href="/account" />}>
                      View orders
                    </Button>
                  ) : null}
                </>
              }
            />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-start gap-3">
                <Badge variant="secondary" className="px-3 py-0.5">
                  Processing
                </Badge>
                <p className="text-lg font-semibold">We&apos;re confirming your payment…</p>
                <p className="text-sm text-muted-foreground">
                  This page updates by itself. Your receipt is emailed to {order?.customerEmail ?? 'you'} once the
                  payment clears.
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
