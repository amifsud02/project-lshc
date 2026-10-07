import Link from 'next/link'
import { redirect } from 'next/navigation'
import StatusBadge from '@/components/Account/StatusBadge'
import { getCurrentUser } from '@/lib/auth/server'
import { formatDate, getUserOrders, orderStatusLabels } from '@/lib/account/data'
import { formatPrice } from '@/lib/shop/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export const metadata = { title: 'Orders | La Salle Handball' }

export default async function AccountOrdersPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?redirect=/account/orders')

  const orders = await getUserOrders(user)

  return (
    <>
      <h2 className="account-title">Orders</h2>
      <p className="account-lead">
        Everything you have bought from the club shop, with the newest first.
      </p>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <p className="text-lg font-semibold">No orders yet</p>
            <p className="text-muted-foreground">
              When you buy something from the shop it will show up here.
            </p>
            <Button render={<Link href="/shop" />} className="mt-3">
              Browse the shop
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Order</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="pr-4">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const count = order.items?.filter((i) => !i.bundleParentLineId).length ?? 0
                return (
                  <TableRow key={order.id}>
                    <TableCell className="pl-4 font-medium">
                      <Link
                        href={`/account/orders/${order.orderNumber}`}
                        className="text-primary hover:underline"
                      >
                        #{order.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} label={orderStatusLabels[order.status]} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatPrice(order.total, order.currency)}
                      <span className="block text-xs text-muted-foreground">
                        for {count} item{count === 1 ? '' : 's'}
                      </span>
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        render={<Link href={`/account/orders/${order.orderNumber}`} />}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  )
}
