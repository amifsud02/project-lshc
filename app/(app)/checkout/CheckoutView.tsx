'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { ArrowRight, Lock, Store, Tag, Truck, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useCart } from '@/lib/shop/cart'
import { usePriceSync } from '@/lib/shop/usePriceSync'
import PriceChanges from '@/components/Shop/PriceChanges'
import { formatPrice, isValidPhone, itemTotal, type CartItem } from '@/lib/shop/types'
import type { ShopSettings } from '@/lib/shop/settings'
import { quote, type CouponTerms, type StoreRules } from '@/lib/shop/pricing'
import { cn } from '@/lib/utils'
import { checkCoupon, createCheckoutSession } from './actions'
import { CURRENCY, cartItemsToGa, gaValue, trackEvent } from '@/lib/analytics/gtag'

type Props = {
  defaults: { email: string; firstName: string; lastName: string; phone: string }
  shop: ShopSettings
  rules: StoreRules
}

const emptySubscribe = () => () => {}
const NO_ITEMS: CartItem[] = []

export default function CheckoutView({ defaults, shop, rules }: Props) {
  // Render cart-dependent UI only after hydration so server/client markup match
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
  // The saved cart is only read in the browser, so the server render (and hydration) sees it empty.
  const savedItems = useCart((s) => s.items)
  const savedSubtotal = useCart((s) => s.subtotal())
  const items = mounted ? savedItems : NO_ITEMS
  const subtotal = mounted ? savedSubtotal : 0
  const [email, setEmail] = useState(defaults.email)
  const [firstName, setFirstName] = useState(defaults.firstName)
  const [lastName, setLastName] = useState(defaults.lastName)
  const [phone, setPhone] = useState(defaults.phone)
  const [country, setCountry] = useState(rules.defaultCountry)
  const [optionId, setOptionId] = useState<string | undefined>()
  const [couponInput, setCouponInput] = useState('')
  const [coupon, setCoupon] = useState<CouponTerms | null>(null)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [couponBusy, setCouponBusy] = useState(false)
  const [address, setAddress] = useState({ addressLine1: '', addressLine2: '', locality: '', postcode: '' })
  const [note, setNote] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [marketingOptIn, setMarketingOptIn] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const units = items.reduce((sum, item) => sum + item.quantity, 0)
  const priced = quote({ rules, subtotal, units, country, optionId, coupon, formatPrice })
  const option = priced.selected
  const method = option?.method ?? 'collect'
  const deliveryFee = priced.shipping
  const total = priced.total
  const priceChanges = usePriceSync(mounted)

  const started = useRef(false)
  useEffect(() => {
    if (!mounted || started.current || items.length === 0) return
    started.current = true
    const gaItems = cartItemsToGa(items)
    trackEvent('begin_checkout', { currency: CURRENCY, value: gaValue(gaItems), items: gaItems })
  }, [mounted, items])

  if (mounted && items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Nothing to check out
          </p>
          <h2 className="text-xl font-semibold">Your cart is empty</h2>
          <p className="text-muted-foreground">
            Add club kit or merchandise to get started.
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
    const problem = !option
      ? "Sorry, we don't ship to that country."
      : !firstName.trim() || !lastName.trim()
        ? 'Please enter your first and last name.'
        : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
          ? 'Please enter a valid email address.'
          : !isValidPhone(phone)
            ? 'Please enter a valid mobile number, so we can arrange the handover.'
            : method === 'deliver' && (!address.addressLine1.trim() || !address.locality.trim())
              ? 'Please enter the delivery address and locality.'
              : !acceptTerms
                ? 'Please accept the terms of sale to continue.'
                : null
    if (problem) {
      setError(problem)
      return
    }
    setBusy(true)
    const gaItems = cartItemsToGa(items)
    trackEvent('add_shipping_info', { currency: CURRENCY, value: gaValue(gaItems), shipping_tier: method, items: gaItems })
    trackEvent('add_payment_info', { currency: CURRENCY, value: gaValue(gaItems), payment_type: 'stripe', items: gaItems })
    try {
      const res = await createCheckoutSession({
        items,
        buyer: { email: email.trim(), firstName: firstName.trim(), lastName: lastName.trim(), phone: phone.trim() },
        fulfilment: { optionId: option?.id, country, ...(method === 'deliver' ? address : {}), note: note.trim() },
        consent: { acceptTerms, marketingOptIn },
        couponCode: coupon?.code,
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

  const link = (href: string | undefined, text: string) =>
    href ? (
      <a href={href} target="_blank" rel="noopener" className="underline underline-offset-2">
        {text}
      </a>
    ) : (
      text
    )

  const field = (id: string, label: string, input: React.ReactNode, hint?: string, required = true) => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>
        {label}
        {required ? <span className="text-destructive"> *</span> : <span className="font-normal text-muted-foreground"> (optional)</span>}
      </Label>
      {input}
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </div>
  )

  const applyCoupon = async () => {
    setCouponError(null)
    setCouponBusy(true)
    try {
      const res = await checkCoupon({ code: couponInput, subtotal, email: email.trim() })
      if (res.ok) {
        setCoupon(res.coupon)
        setCouponInput('')
      } else setCouponError(res.error)
    } catch {
      setCouponError("We couldn't check that coupon. Please try again.")
    } finally {
      setCouponBusy(false)
    }
  }

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <div className="flex flex-col gap-6 lg:col-span-7">
        <PriceChanges changes={priceChanges} />
        <Card>
          <CardContent className="flex flex-col gap-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">1 · Your details</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {field('first-name', 'First name', <Input id="first-name" autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />)}
              {field('last-name', 'Last name', <Input id="last-name" autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} />)}
            </div>
            {field('email', 'Email', <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />, 'Your receipt goes here.')}
            {field('mobile', 'Mobile', <Input id="mobile" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />, 'Only used to arrange collection or delivery.')}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">2 · How you&apos;ll get it</p>
            {rules.countries.length > 1 && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="country">Country</Label>
                <select
                  id="country"
                  autoComplete="country"
                  value={country}
                  onChange={(e) => {
                    setCountry(e.target.value)
                    setOptionId(undefined)
                  }}
                  className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {rules.countries.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {priced.options.length === 0 ? (
              <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                Sorry, we don&apos;t ship to this country yet.
              </p>
            ) : (
              <div role="radiogroup" aria-label="How you'll get it" className="flex flex-col gap-3">
                {priced.options.map((o) => {
                  const on = option?.id === o.id
                  const Icon = o.method === 'collect' ? Store : Truck
                  return (
                    <button
                      key={o.id}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      disabled={!o.available}
                      onClick={() => setOptionId(o.id)}
                      className={cn(
                        'flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60',
                        on ? 'border-primary ring-1 ring-primary' : 'border-input hover:border-primary/50',
                      )}
                    >
                      <span className={cn('mt-0.5 flex size-4 shrink-0 rounded-full border-2', on ? 'border-[5px] border-primary' : 'border-input')} />
                      <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span className="flex flex-1 flex-col gap-0.5">
                        <span className="text-sm font-semibold">{o.title}</span>
                        {o.details ? <span className="text-sm text-muted-foreground">{o.details}</span> : null}
                        {o.hint ? <span className="text-sm text-muted-foreground">{o.hint}</span> : null}
                      </span>
                      <span className="text-sm font-semibold tabular-nums">{o.price ? formatPrice(o.price) : 'Free'}</span>
                    </button>
                  )
                })}
              </div>
            )}
            {method === 'deliver' && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  {field('address-1', 'Address', <Input id="address-1" autoComplete="address-line1" value={address.addressLine1} onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })} />)}
                </div>
                <div className="sm:col-span-2">
                  {field('address-2', 'Apartment, flat or building', <Input id="address-2" autoComplete="address-line2" value={address.addressLine2} onChange={(e) => setAddress({ ...address, addressLine2: e.target.value })} />, undefined, false)}
                </div>
                {field('locality', 'Locality', <Input id="locality" autoComplete="address-level2" value={address.locality} onChange={(e) => setAddress({ ...address, locality: e.target.value })} />)}
                {field('postcode', 'Postcode', <Input id="postcode" autoComplete="postal-code" value={address.postcode} onChange={(e) => setAddress({ ...address, postcode: e.target.value })} />, undefined, false)}
              </div>
            )}
            {field(
              'note',
              'Order note',
              <textarea
                id="note"
                rows={2}
                maxLength={500}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Collecting for my daughter, U14 girls"
                className="w-full rounded-lg border border-input bg-background px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />,
              undefined,
              false,
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-5 lg:col-span-5">
        <Card className="lg:sticky lg:top-8">
          <CardContent className="flex flex-col gap-4">
            <p className="text-lg font-semibold">Order summary</p>
            <ul className="flex flex-col gap-2">
              {items.map((item) => (
                <li key={item.lineId} className="flex justify-between gap-4 text-sm">
                  <span className="text-muted-foreground">
                    {item.productTitle}
                    {item.variantTitle ? ` (${item.variantTitle})` : ''} × {item.quantity}
                  </span>
                  <span className="font-medium tabular-nums">{formatPrice(itemTotal(item))}</span>
                </li>
              ))}
            </ul>
            <Separator />
            {rules.coupons && (
              <div className="flex flex-col gap-2">
                {coupon ? (
                  <div className="flex items-center justify-between gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
                    <span className="flex items-center gap-2">
                      <Tag className="size-3.5 text-primary" />
                      <span className="font-medium uppercase">{coupon.code}</span>
                      {priced.discount === 0 && !coupon.freeShipping && <span className="text-muted-foreground">doesn&apos;t apply to this cart</span>}
                    </span>
                    <button type="button" aria-label="Remove coupon" onClick={() => setCoupon(null)} className="cursor-pointer text-muted-foreground hover:text-foreground">
                      <X className="size-4" />
                    </button>
                  </div>
                ) : (
                  <form
                    className="flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault()
                      if (couponInput.trim()) applyCoupon()
                    }}
                  >
                    <Input aria-label="Coupon code" placeholder="Coupon code" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} />
                    <Button type="submit" variant="outline" disabled={couponBusy || !couponInput.trim()} className="cursor-pointer">
                      {couponBusy ? 'Checking…' : 'Apply'}
                    </Button>
                  </form>
                )}
                {couponError && <p className="text-sm text-destructive">{couponError}</p>}
              </div>
            )}
            <dl className="flex flex-col gap-2 text-sm">
              {(priced.discount > 0 || (priced.tax && !priced.tax.inclusive)) && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="font-medium tabular-nums">{formatPrice(subtotal)}</dd>
                </div>
              )}
              {priced.discount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Coupon {coupon?.code.toUpperCase()}</dt>
                  <dd className="font-medium tabular-nums">−{formatPrice(priced.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{option?.title ?? 'Delivery'}</dt>
                <dd className="font-medium tabular-nums">{deliveryFee ? formatPrice(deliveryFee) : 'Free'}</dd>
              </div>
              {priced.tax && !priced.tax.inclusive && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">
                    {priced.tax.name} ({priced.tax.rate}%)
                  </dt>
                  <dd className="font-medium tabular-nums">{formatPrice(priced.tax.amount)}</dd>
                </div>
              )}
              {priced.tax?.inclusive && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">
                    Includes {priced.tax.name} ({priced.tax.rate}%)
                  </dt>
                  <dd className="text-muted-foreground tabular-nums">{formatPrice(priced.tax.amount)}</dd>
                </div>
              )}
            </dl>
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{formatPrice(total)}</span>
            </div>
            <Separator />
            <label className="flex cursor-pointer items-start gap-2.5 text-sm">
              <input
                id="accept-terms"
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 size-4 accent-primary"
              />
              <span>
                I agree to the {link(shop.termsUrl, 'terms of sale')} and {link(shop.privacyUrl, 'privacy policy')}, and understand
                that personalised items can&apos;t be returned. <span className="text-destructive">*</span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-2.5 text-sm text-muted-foreground">
              <input
                id="marketing-opt-in"
                type="checkbox"
                checked={marketingOptIn}
                onChange={(e) => setMarketingOptIn(e.target.checked)}
                className="mt-0.5 size-4 accent-primary"
              />
              <span>Email me club news and shop offers.</span>
            </label>
            {error && (
              <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="button" size="lg" className="h-12 w-full cursor-pointer text-base" onClick={onPay} disabled={busy || !option}>
              {busy ? (
                'Redirecting…'
              ) : (
                <>
                  Pay {formatPrice(total)} now
                  <ArrowRight />
                </>
              )}
            </Button>
            {!coupon && (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Tag className="size-3 shrink-0" />
                {rules.coupons ? 'Stripe promo codes can be entered on the payment page instead.' : 'Promo codes can be entered on the payment page.'}
              </p>
            )}
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="size-3 shrink-0" />
              Card, Apple Pay or Google Pay on Stripe&apos;s secure page.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
