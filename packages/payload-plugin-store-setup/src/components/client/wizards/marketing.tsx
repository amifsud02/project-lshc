'use client'

import { formatPrice } from '../../../format'
import { currencyDecimals, currencySymbol, DISCOUNT_TYPES } from '../../../reference'
import { Button, ChoiceCards, Field, MoneyInput, NumberInput, Row, TextInput, Toggle } from '../controls'
import type { StepContext, WizardDef } from '../engine'

type Coupon = {
  code: string
  discountType: 'percent' | 'fixed_cart' | 'fixed_product'
  amount: number | null
  freeShipping?: boolean
  expiresAt?: string
  minimumSpend?: number | null
  usageLimit?: number | null
  usageLimitPerUser?: number | null
  individualUse?: boolean
}

const IDEAS: { label: string; coupon: Partial<Coupon> }[] = [
  { label: 'Welcome 10% off', coupon: { code: 'WELCOME10', discountType: 'percent', amount: 10, usageLimitPerUser: 1 } },
  { label: 'Free shipping over 50', coupon: { code: 'FREESHIP', discountType: 'fixed_cart', amount: 0, freeShipping: true, minimumSpend: 5000 } },
  { label: '5 off your first order', coupon: { code: 'FIRST5', discountType: 'fixed_cart', amount: 500, usageLimitPerUser: 1 } },
  { label: 'Flash sale 20%', coupon: { code: 'FLASH20', discountType: 'percent', amount: 20, usageLimit: 100 } },
]

const randomCode = () => Array.from({ length: 8 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 31)]).join('')

/** Reads the coupon back as a sentence, so it's obvious what customers get. */
const describe = (c: Coupon, ctx: StepContext) => {
  const s = { currency: ctx.get('currency') }
  const parts = [
    c.discountType === 'percent' ? `${c.amount ?? 0}% off` : c.amount ? `${formatPrice(c.amount, s)} off ${c.discountType === 'fixed_product' ? 'each eligible item' : 'the order'}` : '',
    c.freeShipping && 'free shipping',
  ].filter(Boolean)
  const what = parts.join(' + ') || 'nothing yet'
  const when = [
    c.minimumSpend && `on orders over ${formatPrice(c.minimumSpend, s)}`,
    c.expiresAt && `until ${new Date(c.expiresAt).toLocaleDateString()}`,
    c.usageLimit && `for the first ${c.usageLimit} uses`,
    c.usageLimitPerUser && `${c.usageLimitPerUser === 1 ? 'once' : `${c.usageLimitPerUser} times`} per customer`,
    c.individualUse && 'not combinable with other coupons',
  ].filter(Boolean)
  return `Code ${c.code || '…'} gives ${what}${when.length ? `, ${when.join(', ')}` : ''}.`
}

export const marketingWizard: WizardDef = {
  id: 'marketing',
  sections: ['marketing'],
  steps: [
    {
      id: 'enable',
      title: 'Coupons and consent',
      render: (ctx) => (
        <>
          <Toggle label="Enable coupon codes" help="Adds a coupon field to cart and checkout." checked={ctx.get('marketing.couponsEnabled')} onChange={(v) => ctx.set('marketing.couponsEnabled', v)} />
          {ctx.get('marketing.couponsEnabled') && (
            <Toggle
              label="Apply several coupons one after another"
              help="The second coupon applies to the already-discounted price."
              checked={ctx.get('marketing.sequentialDiscounts')}
              onChange={(v) => ctx.set('marketing.sequentialDiscounts', v)}
            />
          )}
          <Toggle label="Ask for marketing consent at checkout" help="An unticked box — consent must be opt-in." checked={ctx.get('marketing.newsletterOptIn')} onChange={(v) => ctx.set('marketing.newsletterOptIn', v)} />
          {ctx.get('marketing.newsletterOptIn') && (
            <Field label="Consent checkbox label">
              <TextInput value={ctx.get('marketing.newsletterLabel')} onChange={(v) => ctx.set('marketing.newsletterLabel', v)} />
            </Field>
          )}
        </>
      ),
    },
    {
      id: 'coupon',
      title: 'Create your first coupon',
      description: 'Start from an idea or build your own.',
      when: (ctx) => Boolean(ctx.get('marketing.couponsEnabled')),
      skippable: true,
      render: (ctx) => {
        const c: Coupon = ctx.local.coupon ?? { code: '', discountType: 'percent', amount: 10 }
        const set = (patch: Partial<Coupon>) => ctx.setLocal('coupon', { ...c, ...patch })
        const code = ctx.get('currency.code') ?? 'EUR'
        const money = { symbol: currencySymbol(code), digits: currencyDecimals(code) }
        return (
          <>
            <div className="ss-presets">
              {IDEAS.map((idea) => (
                <Button key={idea.label} kind="secondary" onClick={() => ctx.setLocal('coupon', { discountType: 'percent', amount: 0, ...idea.coupon })}>
                  {idea.label}
                </Button>
              ))}
            </div>
            <Field label="Coupon code">
              <span className="ss-copy">
                <TextInput value={c.code} onChange={(v) => set({ code: v.toUpperCase().replace(/\s/g, '') })} />
                <Button kind="ghost" onClick={() => set({ code: randomCode() })}>
                  Generate
                </Button>
              </span>
            </Field>
            <Field label="Discount type">
              <ChoiceCards columns={3} options={DISCOUNT_TYPES} value={c.discountType} onChange={(v) => set({ discountType: v })} />
            </Field>
            <Row>
              <Field label="Amount">
                {c.discountType === 'percent' ? (
                  <NumberInput value={c.amount} min={0} max={100} suffix="%" onChange={(amount) => set({ amount })} />
                ) : (
                  <MoneyInput key={c.discountType} {...money} value={c.amount} onChange={(amount) => set({ amount })} />
                )}
              </Field>
              <Field label="Minimum spend" help="Optional.">
                <MoneyInput {...money} value={c.minimumSpend} onChange={(minimumSpend) => set({ minimumSpend })} />
              </Field>
              <Field label="Expires">
                <input className="ss-input" type="date" value={c.expiresAt?.slice(0, 10) ?? ''} onChange={(e) => set({ expiresAt: e.target.value || undefined })} />
              </Field>
            </Row>
            <Row>
              <Field label="Total uses allowed">
                <NumberInput value={c.usageLimit} min={0} placeholder="Unlimited" onChange={(usageLimit) => set({ usageLimit })} />
              </Field>
              <Field label="Uses per customer">
                <NumberInput value={c.usageLimitPerUser} min={0} placeholder="Unlimited" onChange={(usageLimitPerUser) => set({ usageLimitPerUser })} />
              </Field>
            </Row>
            <Toggle label="Also gives free shipping" help="Needs a free shipping method that accepts coupons." checked={c.freeShipping} onChange={(freeShipping) => set({ freeShipping })} />
            <Toggle label="Can’t be combined with other coupons" checked={c.individualUse} onChange={(individualUse) => set({ individualUse })} />
            <p className="ss-sentence">{describe(c, ctx)}</p>
          </>
        )
      },
      validate: (ctx) => {
        const c: Coupon | undefined = ctx.local.coupon
        if (!c?.code) return 'Give the coupon a code.'
        if (!c.amount && !c.freeShipping) return 'Set a discount amount or tick free shipping.'
        return null
      },
      onContinue: async (ctx) => {
        if (ctx.local.couponCreated) return
        ctx.setState(await ctx.api.post('/records', { kind: 'coupons', docs: [{ ...ctx.local.coupon, amount: ctx.local.coupon.amount ?? 0 }] }))
        ctx.setLocal('couponCreated', true)
      },
      cta: 'Create coupon',
    },
  ],
  doneMessage: (ctx) => (ctx.local.coupon?.code ? `Share ${ctx.local.coupon.code} in your newsletter or on social media.` : 'Coupon settings saved.'),
}
