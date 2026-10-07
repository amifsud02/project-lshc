import Link from 'next/link'
import { XCircle } from 'lucide-react'
import PageHeader from '@/components/PageHeader/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export const metadata = { title: 'Payment cancelled' }

export default function CancelPage() {
  return (
    <>
      <PageHeader pageName="Payment cancelled" />
      <section className="parent">
        <Card className="mx-auto max-w-2xl">
          <CardContent className="flex flex-col items-start gap-4">
            <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <XCircle className="size-5" />
            </span>
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold">Payment not completed</h2>
              <p className="text-muted-foreground">
                Your payment wasn&apos;t completed. Your cart is still saved, so you can pick up
                right where you left off.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button render={<Link href="/cart" />}>Back to cart</Button>
              <Button variant="outline" render={<Link href="/shop" />}>
                Keep browsing
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  )
}
