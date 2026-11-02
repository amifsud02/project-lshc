'use client'

import { useEffect, useRef } from 'react'
import { formatPrice } from '../../../format'
import { countryName, COUNTRIES, EU_COUNTRIES, TAX_BASED_ON, VAT_STANDARD_RATES } from '../../../reference'
import { Button, Callout, ChoiceCards, Field, NumberInput, Row, Select, TextInput, Toggle } from '../controls'
import type { StepContext, WizardDef } from '../engine'

type Rate = { country?: string; state?: string; postcodes?: string; cities?: string; rate: number; name: string; priority?: number; taxClass?: string; compound?: boolean; shipping?: boolean }

const enabled = (ctx: StepContext) => Boolean(ctx.get('tax.enabled'))

/** Worked example: what a 100.00 price means under the chosen "prices entered with tax" setting. */
function Example({ ctx }: { ctx: StepContext }) {
  const country = ctx.get('general.country')
  const rate = (ctx.local.rates as Rate[] | undefined)?.[0]?.rate ?? VAT_STANDARD_RATES[country] ?? 20
  const inclusive = ctx.get('tax.pricesIncludeTax') === 'yes'
  const entered = 10000
  const net = inclusive ? Math.round(entered / (1 + rate / 100)) : entered
  const gross = inclusive ? entered : Math.round(entered * (1 + rate / 100))
  const s = { currency: ctx.get('currency') }
  return (
    <div className="ss-example">
      <span className="ss-eyebrow">Example at {rate}%</span>
      <dl>
        <dt>You enter</dt>
        <dd>{formatPrice(entered, s)}</dd>
        <dt>Tax</dt>
        <dd>{formatPrice(gross - net, s)}</dd>
        <dt>Customer pays</dt>
        <dd>
          <strong>{formatPrice(gross, s)}</strong>
        </dd>
        <dt>You keep (before fees)</dt>
        <dd>{formatPrice(net, s)}</dd>
      </dl>
    </div>
  )
}

function RatesEditor({ ctx }: { ctx: StepContext }) {
  const rates: Rate[] | undefined = ctx.local.rates
  const loading = useRef(false)
  useEffect(() => {
    if (rates !== undefined || loading.current) return
    loading.current = true
    ctx.api.get('/records?kind=taxRates').then((r) => ctx.setLocal('rates', r.docs))
  }, [rates, ctx])
  if (rates === undefined) return <p className="ss-muted">Loading your tax rates…</p>

  const country: string = ctx.get('general.country')
  const preset = VAT_STANDARD_RATES[country]
  const add = (rows: Rate[]) => ctx.setLocal('rates', [...rates.filter((r) => !rows.some((n) => n.country === r.country && !r.state)), ...rows])
  const update = (i: number, patch: Partial<Rate>) => ctx.setLocal('rates', rates.map((r, j) => (j === i ? { ...r, ...patch } : r)))
  const sellsEU = EU_COUNTRIES.includes(country) && ctx.get('general.sellingLocations') !== 'specific'

  return (
    <div className="ss-stack">
      <div className="ss-presets">
        {preset !== undefined && (
          <Button kind="secondary" onClick={() => add([{ country, rate: preset, name: 'VAT', priority: 1, taxClass: 'standard', shipping: true }])}>
            + {countryName(country)} standard rate ({preset}%)
          </Button>
        )}
        {sellsEU && (
          <Button
            kind="secondary"
            onClick={() => add(EU_COUNTRIES.map((c) => ({ country: c, rate: VAT_STANDARD_RATES[c], name: 'VAT', priority: 1, taxClass: 'standard', shipping: true })))}
          >
            + Standard VAT for every EU country (OSS)
          </Button>
        )}
        <Button kind="ghost" onClick={() => ctx.setLocal('rates', [...rates, { rate: 0, name: 'Tax', priority: 1, taxClass: 'standard', shipping: true }])}>
          + Add a rate by hand
        </Button>
      </div>
      {sellsEU && <Callout>Selling to consumers across the EU above €10,000 a year? The One-Stop Shop scheme charges each buyer’s local VAT rate. Rates change — check them before launch.</Callout>}
      {rates.length > 0 ? (
        <div className="ss-table-wrap">
          <table className="ss-table ss-table--edit">
            <thead>
              <tr>
                <th>Country</th>
                <th>State</th>
                <th>Postcodes</th>
                <th>Rate %</th>
                <th>Name</th>
                <th>Class</th>
                <th>Shipping</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rates.map((r, i) => (
                <tr key={i}>
                  <td>
                    <Select options={COUNTRIES} value={r.country} placeholder="Any" onChange={(v) => update(i, { country: v || undefined })} />
                  </td>
                  <td>
                    <TextInput value={r.state} placeholder="*" onChange={(v) => update(i, { state: v })} />
                  </td>
                  <td>
                    <TextInput value={r.postcodes} placeholder="*" onChange={(v) => update(i, { postcodes: v })} />
                  </td>
                  <td>
                    <NumberInput value={r.rate} min={0} max={100} step={0.01} onChange={(v) => update(i, { rate: v ?? 0 })} />
                  </td>
                  <td>
                    <TextInput value={r.name} onChange={(v) => update(i, { name: v })} />
                  </td>
                  <td>
                    <Select
                      options={[{ value: 'standard', label: 'Standard' }, ...(ctx.get('tax.classes') ?? []).map((c: { name: string }) => ({ value: c.name, label: c.name }))]}
                      value={r.taxClass ?? 'standard'}
                      onChange={(v) => update(i, { taxClass: v })}
                    />
                  </td>
                  <td>
                    <input type="checkbox" checked={r.shipping ?? true} onChange={(e) => update(i, { shipping: e.target.checked })} aria-label="Applies to shipping" />
                  </td>
                  <td>
                    <button type="button" className="ss-icon-btn" aria-label="Remove rate" onClick={() => ctx.setLocal('rates', rates.filter((_, j) => j !== i))}>
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="ss-muted">No rates yet. Add one above.</p>
      )}
    </div>
  )
}

export const taxWizard: WizardDef = {
  id: 'tax',
  sections: ['tax'],
  steps: [
    {
      id: 'enable',
      title: 'Do you need to charge tax?',
      description: 'If you are registered for VAT or sales tax, turn this on. Not sure? Ask your accountant — you can switch it on later.',
      render: (ctx) => (
        <ChoiceCards
          options={[
            { value: 'yes', label: 'Yes, charge tax on my sales', description: 'Set up rates and how prices are shown.' },
            { value: 'no', label: 'No, I don’t charge tax', description: 'Prices are shown exactly as you enter them.' },
          ]}
          value={ctx.get('tax.enabled') === undefined ? null : enabled(ctx) ? 'yes' : 'no'}
          onChange={(v) => ctx.set('tax.enabled', v === 'yes')}
        />
      ),
    },
    {
      id: 'prices',
      title: 'How do you enter your prices?',
      when: enabled,
      render: (ctx) => (
        <div className="ss-split">
          <div>
            <ChoiceCards
              options={[
                { value: 'yes', label: 'Including tax', description: 'Common in Europe: the price you type is what customers pay.' },
                { value: 'no', label: 'Excluding tax', description: 'Common in the US: tax is added at checkout.' },
              ]}
              value={ctx.get('tax.pricesIncludeTax') ?? 'no'}
              onChange={(v) => {
                ctx.set('tax.pricesIncludeTax', v)
                ctx.set('tax.displayShop', v === 'yes' ? 'incl' : 'excl')
                ctx.set('tax.displayCart', v === 'yes' ? 'incl' : 'excl')
              }}
            />
            <Field label="Calculate tax based on">
              <Select options={TAX_BASED_ON} value={ctx.get('tax.basedOn') ?? 'shipping'} onChange={(v) => ctx.set('tax.basedOn', v)} />
            </Field>
            <Row>
              <Field label="Show prices in the shop">
                <Select
                  options={[
                    { value: 'incl', label: 'Including tax' },
                    { value: 'excl', label: 'Excluding tax' },
                  ]}
                  value={ctx.get('tax.displayShop') ?? 'excl'}
                  onChange={(v) => ctx.set('tax.displayShop', v)}
                />
              </Field>
              <Field label="Show prices in cart and checkout">
                <Select
                  options={[
                    { value: 'incl', label: 'Including tax' },
                    { value: 'excl', label: 'Excluding tax' },
                  ]}
                  value={ctx.get('tax.displayCart') ?? 'excl'}
                  onChange={(v) => ctx.set('tax.displayCart', v)}
                />
              </Field>
            </Row>
            <Field label="Price suffix" help="Optional, e.g. “incl. VAT”.">
              <TextInput value={ctx.get('tax.priceSuffix')} onChange={(v) => ctx.set('tax.priceSuffix', v)} />
            </Field>
            <Toggle label="Round tax at subtotal level, instead of per line" checked={ctx.get('tax.roundAtSubtotal')} onChange={(v) => ctx.set('tax.roundAtSubtotal', v)} />
            <Toggle
              label="Show each tax separately on the order total"
              checked={ctx.get('tax.totalsDisplay') !== 'single'}
              onChange={(v) => ctx.set('tax.totalsDisplay', v ? 'itemized' : 'single')}
            />
          </div>
          <Example ctx={ctx} />
        </div>
      ),
    },
    {
      id: 'classes',
      title: 'Tax classes',
      description: 'Classes let some products use a different rate — e.g. books or children’s clothing at a reduced rate.',
      when: enabled,
      skippable: true,
      render: (ctx) => {
        const classes: { name: string }[] = ctx.get('tax.classes') ?? []
        return (
          <div className="ss-stack">
            <p className="ss-muted">Every product uses the Standard class unless you pick another one.</p>
            {classes.map((c, i) => (
              <Row key={i}>
                <TextInput value={c.name} onChange={(v) => ctx.set('tax.classes', classes.map((x, j) => (j === i ? { name: v } : x)))} />
                <Button kind="ghost" onClick={() => ctx.set('tax.classes', classes.filter((_, j) => j !== i))}>
                  Remove
                </Button>
              </Row>
            ))}
            <Button kind="secondary" onClick={() => ctx.set('tax.classes', [...classes, { name: '' }])}>
              + Add class
            </Button>
          </div>
        )
      },
      validate: (ctx) => ((ctx.get('tax.classes') ?? []).some((c: { name: string }) => !c.name.trim()) ? 'Name every class, or remove empty ones.' : null),
    },
    {
      id: 'rates',
      title: 'Add your tax rates',
      description: 'The first matching row for the customer’s address is used. Leave country empty to match everywhere.',
      when: enabled,
      render: (ctx) => <RatesEditor ctx={ctx} />,
      validate: (ctx) => ((ctx.local.rates ?? []).length === 0 ? 'Add at least one rate, or go back and turn tax off.' : null),
      onContinue: async (ctx) => {
        ctx.setState(await ctx.api.post('/records', { kind: 'taxRates', docs: ctx.local.rates, replace: true }))
      },
    },
  ],
  doneMessage: (ctx) =>
    enabled(ctx) ? `Tax is on with ${(ctx.local.rates ?? []).length} rate(s).` : 'Tax is off. Prices will be charged exactly as entered.',
}
