'use client'

import { useEffect, useRef } from 'react'
import { formatPrice } from '../../../format'
import { countryName, COUNTRIES, currencyDecimals, currencySymbol, EU_COUNTRIES, FREE_SHIPPING_REQUIRES, SHIPPING_METHODS } from '../../../reference'
import { Button, Callout, CountryChips, Field, MoneyInput, Row, Select, TextArea, TextInput, Toggle } from '../controls'
import type { StepContext, WizardDef } from '../engine'

type Method = {
  blockType: 'flat_rate' | 'free_shipping' | 'local_pickup'
  title?: string
  cost?: number | null
  perItem?: number | null
  taxStatus?: 'taxable' | 'none'
  requires?: string
  minAmount?: number | null
  instructions?: string
}
type Zone = { name: string; order?: number; countries?: string[]; methods: Method[] }

const zonesOf = (ctx: StepContext): Zone[] => ctx.local.zones ?? []
const setZones = (ctx: StepContext, zones: Zone[]) => ctx.setLocal('zones', zones.map((z, i) => ({ ...z, order: i })))

const suggested = (ctx: StepContext): Zone[] => {
  const home: string = ctx.get('general.country')
  const zones: Zone[] = []
  if (home) zones.push({ name: countryName(home), countries: [home], methods: [{ blockType: 'flat_rate', title: 'Standard delivery', cost: 450, taxStatus: 'taxable' }] })
  if (EU_COUNTRIES.includes(home))
    zones.push({ name: 'Europe', countries: EU_COUNTRIES.filter((c) => c !== home), methods: [{ blockType: 'flat_rate', title: 'EU delivery', cost: 1200, taxStatus: 'taxable' }] })
  if (ctx.get('general.shipTo') !== 'specific')
    zones.push({ name: 'Rest of the world', countries: [], methods: [{ blockType: 'flat_rate', title: 'International delivery', cost: 2500, taxStatus: 'taxable' }] })
  return zones
}

/** First zone whose regions include the country wins; a zone with no regions catches the rest. */
const matchZone = (zones: Zone[], country: string) =>
  zones.find((z) => z.countries?.includes(country)) ?? zones.find((z) => !z.countries?.length)

function useLoadZones(ctx: StepContext) {
  const loading = useRef(false)
  useEffect(() => {
    if (ctx.local.zones !== undefined || loading.current) return
    loading.current = true
    ctx.api.get('/records?kind=shippingZones').then((r) => setZones(ctx, r.docs.length ? r.docs : suggested(ctx)))
  }, [ctx])
}

function MethodEditor({ ctx, method, onChange, onRemove }: { ctx: StepContext; method: Method; onChange: (m: Method) => void; onRemove: () => void }) {
  const code = ctx.get('currency.code') ?? 'EUR'
  const money = { symbol: currencySymbol(code), digits: currencyDecimals(code) }
  const set = (patch: Partial<Method>) => onChange({ ...method, ...patch })
  return (
    <div className="ss-subcard">
      <div className="ss-subcard__head">
        <strong>{SHIPPING_METHODS.find((m) => m.value === method.blockType)?.label}</strong>
        <button type="button" className="ss-icon-btn" aria-label="Remove method" onClick={onRemove}>
          ×
        </button>
      </div>
      <Field label="Name customers see">
        <TextInput value={method.title} onChange={(title) => set({ title })} />
      </Field>
      {method.blockType === 'flat_rate' && (
        <Row>
          <Field label="Cost per order">
            <MoneyInput {...money} value={method.cost} onChange={(cost) => set({ cost })} />
          </Field>
          <Field label="Plus per item" help="Optional.">
            <MoneyInput {...money} value={method.perItem} onChange={(perItem) => set({ perItem })} />
          </Field>
          <Field label="Tax status">
            <Select
              options={[
                { value: 'taxable', label: 'Taxable' },
                { value: 'none', label: 'None' },
              ]}
              value={method.taxStatus ?? 'taxable'}
              onChange={(v) => set({ taxStatus: v as Method['taxStatus'] })}
            />
          </Field>
        </Row>
      )}
      {method.blockType === 'free_shipping' && (
        <Row>
          <Field label="Free shipping requires">
            <Select options={FREE_SHIPPING_REQUIRES} value={method.requires ?? 'none'} onChange={(requires) => set({ requires })} />
          </Field>
          {['min_amount', 'either', 'both'].includes(method.requires ?? '') && (
            <Field label="Minimum order amount">
              <MoneyInput {...money} value={method.minAmount} onChange={(minAmount) => set({ minAmount })} />
            </Field>
          )}
        </Row>
      )}
      {method.blockType === 'local_pickup' && (
        <>
          <Field label="Cost" help="Usually free.">
            <MoneyInput {...money} value={method.cost} onChange={(cost) => set({ cost })} />
          </Field>
          <Field label="Pickup instructions">
            <TextArea rows={2} value={method.instructions} onChange={(instructions) => set({ instructions })} placeholder="Where and when to collect." />
          </Field>
        </>
      )}
    </div>
  )
}

function Simulator({ ctx }: { ctx: StepContext }) {
  const zones = zonesOf(ctx)
  const country: string = ctx.local.simCountry ?? ctx.get('general.country') ?? ''
  const subtotal: number = ctx.local.simSubtotal ?? 3000
  const zone = country ? matchZone(zones, country) : undefined
  const s = { currency: ctx.get('currency') }
  const code = ctx.get('currency.code') ?? 'EUR'
  return (
    <div className="ss-sim">
      <span className="ss-eyebrow">Try it</span>
      <Row>
        <Field label="Customer in">
          <Select options={COUNTRIES} value={country} onChange={(v) => ctx.setLocal('simCountry', v)} />
        </Field>
        <Field label="Cart subtotal">
          <MoneyInput symbol={currencySymbol(code)} digits={currencyDecimals(code)} value={subtotal} onChange={(v) => ctx.setLocal('simSubtotal', v ?? 0)} />
        </Field>
      </Row>
      {!zone ? (
        <Callout tone="warning">No zone covers {countryName(country) || 'this country'} — customers there can’t check out. Add a zone with no regions to catch everyone else.</Callout>
      ) : (
        <ul className="ss-sim__list">
          <li className="ss-muted">Zone: {zone.name}</li>
          {zone.methods.map((m, i) => {
            const needsMin = ['min_amount', 'either', 'both'].includes(m.requires ?? '')
            const blocked = m.blockType === 'free_shipping' && needsMin && subtotal < (m.minAmount ?? 0)
            const price = m.blockType === 'free_shipping' ? 0 : (m.cost ?? 0)
            return (
              <li key={i} className={blocked ? 'is-off' : ''}>
                <span>{m.title}</span>
                <strong>
                  {blocked
                    ? `Spend ${formatPrice((m.minAmount ?? 0) - subtotal, s)} more`
                    : m.blockType === 'free_shipping' && m.requires === 'coupon'
                      ? 'Free with coupon'
                      : price === 0
                        ? 'Free'
                        : formatPrice(price, s)}
                </strong>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export const shippingWizard: WizardDef = {
  id: 'shipping',
  sections: ['shipping'],
  steps: [
    {
      id: 'zones',
      title: 'Where do you ship?',
      description: 'A shipping zone is a group of countries that share the same rates. We’ve suggested some to start with.',
      render: (ctx) => <Zones ctx={ctx} />,
      validate: (ctx) => (zonesOf(ctx).length === 0 ? 'Add at least one zone.' : zonesOf(ctx).some((z) => !z.name) ? 'Name every zone.' : null),
    },
    {
      id: 'rates',
      title: 'Set your shipping rates',
      description: 'Add one or more methods to each zone. Customers choose between them at checkout.',
      render: (ctx) => (
        <div className="ss-split ss-split--wide">
          <div className="ss-stack">
            {zonesOf(ctx).map((zone, zi) => {
              const update = (methods: Method[]) => setZones(ctx, zonesOf(ctx).map((z, j) => (j === zi ? { ...z, methods } : z)))
              return (
                <fieldset key={zi} className="ss-section">
                  <legend>{zone.name}</legend>
                  {zone.methods.map((m, mi) => (
                    <MethodEditor
                      key={mi}
                      ctx={ctx}
                      method={m}
                      onChange={(next) => update(zone.methods.map((x, j) => (j === mi ? next : x)))}
                      onRemove={() => update(zone.methods.filter((_, j) => j !== mi))}
                    />
                  ))}
                  <div className="ss-presets">
                    {SHIPPING_METHODS.map((m) => (
                      <Button key={m.value} kind="ghost" onClick={() => update([...zone.methods, { blockType: m.value as Method['blockType'], title: m.label, cost: 0 }])}>
                        + {m.label}
                      </Button>
                    ))}
                  </div>
                </fieldset>
              )
            })}
          </div>
          <Simulator ctx={ctx} />
        </div>
      ),
      validate: (ctx) => (zonesOf(ctx).some((z) => z.methods.length === 0) ? 'Every zone needs at least one method — or remove the zone.' : null),
      onContinue: async (ctx) => {
        ctx.setState(await ctx.api.post('/records', { kind: 'shippingZones', docs: zonesOf(ctx), replace: true }))
      },
    },
    {
      id: 'options',
      title: 'Shipping options',
      render: (ctx) => (
        <>
          <Toggle label="Show the shipping calculator on the cart page" checked={ctx.get('shipping.enableCalculator')} onChange={(v) => ctx.set('shipping.enableCalculator', v)} />
          <Toggle label="Hide shipping costs until an address is entered" checked={ctx.get('shipping.hideUntilAddress')} onChange={(v) => ctx.set('shipping.hideUntilAddress', v)} />
          <Field label="Shipping destination">
            <Select
              options={[
                { value: 'shipping', label: 'Default to customer shipping address' },
                { value: 'billing', label: 'Default to customer billing address' },
                { value: 'billing_only', label: 'Force shipping to the customer billing address' },
              ]}
              value={ctx.get('shipping.destination') ?? 'shipping'}
              onChange={(v) => ctx.set('shipping.destination', v)}
            />
          </Field>
        </>
      ),
    },
  ],
  doneMessage: () => 'Shipping zones and rates are saved. Fine-tune them any time under Store → Shipping zones.',
}

function Zones({ ctx }: { ctx: StepContext }) {
  useLoadZones(ctx)
  if (ctx.local.zones === undefined) return <p className="ss-muted">Loading your zones…</p>
  const zones = zonesOf(ctx)
  const update = (i: number, patch: Partial<Zone>) => setZones(ctx, zones.map((z, j) => (j === i ? { ...z, ...patch } : z)))
  const move = (i: number, dir: -1 | 1) => {
    const next = [...zones]
    ;[next[i], next[i + dir]] = [next[i + dir], next[i]]
    setZones(ctx, next)
  }
  return (
    <div className="ss-stack">
      {zones.map((z, i) => (
        <div key={i} className="ss-subcard">
          <div className="ss-subcard__head">
            <span className="ss-zone-order">{i + 1}</span>
            <TextInput value={z.name} onChange={(name) => update(i, { name })} placeholder="Zone name" />
            <span className="ss-checkout-preview__move">
              <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                ↑
              </button>
              <button type="button" aria-label="Move down" disabled={i === zones.length - 1} onClick={() => move(i, 1)}>
                ↓
              </button>
              <button type="button" className="ss-icon-btn" aria-label="Remove zone" onClick={() => setZones(ctx, zones.filter((_, j) => j !== i))}>
                ×
              </button>
            </span>
          </div>
          <Field label="Regions" help={z.countries?.length ? undefined : 'No regions: this zone covers every country not in another zone.'}>
            <CountryChips value={z.countries} onChange={(countries) => update(i, { countries })} />
          </Field>
        </div>
      ))}
      <div className="ss-presets">
        <Button kind="secondary" onClick={() => setZones(ctx, [...zones, { name: '', countries: [], methods: [] }])}>
          + Add zone
        </Button>
        <Button kind="ghost" onClick={() => setZones(ctx, suggested(ctx))}>
          Reset to suggestions
        </Button>
      </div>
      <p className="ss-muted">Zones are checked top to bottom; a customer gets the first one that includes their country.</p>
    </div>
  )
}
