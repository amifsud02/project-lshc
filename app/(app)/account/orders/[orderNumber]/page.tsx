import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import OrderReceipt, { type ReceiptLine } from '@/components/Shop/OrderReceipt'
import { Button } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/auth/server'
import { formatDate, getUserOrder, orderStatusLabels, statusTone } from '@/lib/account/data'

type Params = Promise<{ orderNumber: string }>

export async function generateMetadata({ params }: { params: Params }) {
  const { orderNumber } = await params
  return { title: `Order #${orderNumber} | La Salle Handball` }
}

export default async function AccountOrderPage({ params }: { params: Params }) {
  const { orderNumber } = await params
  const user = await getCurrentUser()
  if (!user) redirect(`/login?redirect=/account/orders/${encodeURIComponent(orderNumber)}`)

  const order = await getUserOrder(user, orderNumber)
  if (!order) notFound()

  const currency = order.currency ?? 'eur'
  const lines: ReceiptLine[] = (order.items ?? []).map((item) => {
    const fields =
      item.customFieldValues &&
      typeof item.customFieldValues === 'object' &&
      !Array.isArray(item.customFieldValues)
        ? Object.entries(item.customFieldValues as Record<string, unknown>).map(
            ([key, value]): [string, string] => [key, String(value ?? '')]
          )
        : []
    return {
      title: item.productTitle,
      quantity: item.quantity ?? 1,
      lineTotal: (item.unitPrice ?? 0) * (item.quantity ?? 1),
      isChild: Boolean(item.bundleParentLineId),
      fields,
    }
  })

  const details: [string, string][] = [['Email', order.customerEmail ?? '']]
  if (order.customerName) details.push(['Name', order.customerName])
  if (order.customerPhone) details.push(['Phone', order.customerPhone])
  if (order.paidAt) details.push(['Paid on', formatDate(order.paidAt)])

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="mb-3 -ml-2"
        render={<Link href="/account/orders" />}
      >
        <ArrowLeft />
        Back to orders
      </Button>
      <h2 className="account-title">Order #{order.orderNumber}</h2>
      <OrderReceipt
        orderNumber={order.orderNumber ?? ''}
        email={order.customerEmail ?? ''}
        statusLabel={orderStatusLabels[order.status]}
        paid={statusTone(order.status) === 'ok'}
        dateLabel={`Placed ${formatDate(order.createdAt)}`}
        lines={lines}
        subtotal={order.subtotal ?? order.total}
        total={order.total}
        currency={currency}
        details={details}
      />
    </>
  )
}
