'use client'

import Link from 'next/link'
import { useState, useSyncExternalStore } from 'react'
import { ArrowRight, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useCart } from '@/lib/shop/cart'
import { formatPrice } from '@/lib/shop/types'
import { createCheckoutSession } from './actions'

type Props = {
  defaults: { email: string; name: string; phone: string }
}

const emptySubscribe = () => () => {}

export default function CheckoutView({ defaults }: Props) {
  const items = useCart((s) => s.items)
  const subtotal = useCart((s) => s.subtotal())
  const [email, setEmail] = useState(defaults.email)
  const [name, setName] = useState(defaults.name)
  const [phone, setPhone] = useState(defaults.phone)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Render cart-dependent UI only after hydration so server/client markup match
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )

  if (mounted && items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Nothing to check out
          </p>
          <h2 className="text-xl font-semibold">Your cart is empty</h2>
          <p className="text-muted-foreground">
            Add a membership, bundle or kit item to get started.
          </p>
          <Button render={<Link href="/shop" />} className="mt-3">
            Back to shop
          </Button>
        </CardContent>
      </Card>
    )
  }

  const onPay = async () => {
    setError(null)
    if (!email.trim()) {
      setError('Please enter an email address.')
      return
    }
    setBusy(true)
    try {
      const res = await createCheckoutSession({
        items,
        buyer: { email: email.trim(), name: name.trim(), phone: phone.trim() },
      })
      if (!res.ok) {
        setError(res.error)
        setBusy(false)
        return
      }
      window.location.assign(res.url)
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Please try again.')
      setBusy(false)
    }
  }

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <div className="flex flex-col gap-6 lg:col-span-7">
        <Card>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold">Order summary</h2>
              <p className="text-sm text-muted-foreground">
                {items.length} line{items.length === 1 ? '' : 's'} in your order
              </p>
            </div>
            <ul className="flex flex-col divide-y">
              {items.map((item) => (
                <li key={item.lineId} className="flex justify-between gap-4 py-3 first:pt-0">
                  <span className="text-sm font-medium">
                    {item.productTitle}{' '}
                    <span className="font-normal text-muted-foreground">× {item.quantity}</span>
                  </span>
                  <span className="text-sm font-medium tabular-nums">
                    {formatPrice(item.unitPrice * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-5 lg:col-span-5">
        <Card>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold">Your details</h2>
              <p className="text-sm text-muted-foreground">
                We&apos;ll send the receipt and any follow-ups to the email below.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <Label className="flex flex-col items-start gap-1.5">
                <span>
                  Email <span className="text-destructive">*</span>
                </span>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Label>
              <Label className="flex flex-col items-start gap-1.5">
                Full name
                <Input type="text" value={name} onChange={(e) => setName(e.target.value)} />
              </Label>
              <Label className="flex flex-col items-start gap-1.5">
                Phone
                <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-4">
            <p className="text-lg font-semibold">Payment total</p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium tabular-nums">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">VAT</span>
              <span className="text-muted-foreground">incl.</span>
            </div>
            <Separator />
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{formatPrice(subtotal)}</span>
            </div>
            {error && (
              <p
                role="alert"
                className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </p>
            )}
            <Button
              type="button"
              size="lg"
              className="h-12 w-full cursor-pointer text-base"
              onClick={onPay}
              disabled={busy}
            >
              {busy ? (
                'Redirecting…'
              ) : (
                <>
                  Pay with card
                  <ArrowRight />
                </>
              )}
            </Button>
            <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Lock className="size-3" />
              Redirected to Stripe · 256-bit encryption
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
