'use client'

import { formatPrice } from '../../../format'
import {
  COUNTRIES,
  CURRENCIES,
  CURRENCY_POSITIONS,
  currencyDecimals,
  CUSTOMER_LOCATION,
  SELLING_LOCATIONS,
  SHIP_TO,
} from '../../../reference'
import { Button, ChoiceCards, CountryChips, Field, NumberInput, Row, Select, TextInput } from '../controls'
import type { StepContext, WizardDef } from '../engine'

/** Separator conventions people expect for a currency, so one click gets the format right. */
const LOCALE_FORMATS: Record<string, { thousand: string; decimal: string; position: string }> = {
  EUR: { thousand: '.', decimal: ',', position: 'right_space' },
  USD: { thousand: ',', decimal: '.', position: 'left' },
  GBP: { thousand: ',', decimal: '.', position: 'left' },
  CHF: { thousand: "'", decimal: '.', position: 'left_space' },
  SEK: { thousand: ' ', decimal: ',', position: 'right_space' },
}

function PricePreview({ ctx }: { ctx: StepContext }) {
  const settings = { currency: ctx.get('currency') }
  const samples = [1999, 249900, 125000000]
  return (
    <div className="ss-preview-prices" aria-live="polite">
      <span className="ss-eyebrow">Preview</span>
      <div className="ss-preview-prices__card">
        <div className="ss-preview-prices__img" aria-hidden />
        <div>
          <strong>Sample product</strong>
          <div className="ss-preview-prices__price">
            <del>{formatPrice(2499, settings)}</del> {formatPrice(1999, settings)}
          </div>
        </div>
      </div>
      <div className="ss-preview-prices__list">
        {samples.map((n) => (
          <code key={n}>{formatPrice(n, settings)}</code>
        ))}
      </div>
    </div>
  )
}

export const locationWizard: WizardDef = {
  id: 'location-currency',
  sections: ['general', 'currency'],
  steps: [
    {
      id: 'address',
      title: 'Where is your store?',
      description: 'Used for tax and shipping calculations, and as the return address on invoices.',
      render: (ctx) => (
        <>
          <Field label="Address line 1">
            <TextInput value={ctx.get('general.address1')} onChange={(v) => ctx.set('general.address1', v)} />
          </Field>
          <Field label="Address line 2">
            <TextInput value={ctx.get('general.address2')} onChange={(v) => ctx.set('general.address2', v)} />
          </Field>
          <Row>
            <Field label="City">
              <TextInput value={ctx.get('general.city')} onChange={(v) => ctx.set('general.city', v)} />
            </Field>
            <Field label="Postcode / ZIP">
              <TextInput value={ctx.get('general.postcode')} onChange={(v) => ctx.set('general.postcode', v)} />
            </Field>
            <Field label="State / county">
              <TextInput value={ctx.get('general.state')} onChange={(v) => ctx.set('general.state', v)} />
            </Field>
          </Row>
          <Field label="Country / region">
            <Select options={COUNTRIES} value={ctx.get('general.country')} onChange={(v) => ctx.set('general.country', v)} placeholder="Choose a country" />
          </Field>
        </>
      ),
      validate: (ctx) => (!ctx.get('general.address1') || !ctx.get('general.city') || !ctx.get('general.country') ? 'Add at least the first address line, city and country.' : null),
    },
    {
      id: 'regions',
      title: 'Where do you sell and ship?',
      description: 'Customers outside these countries won’t be able to check out.',
      render: (ctx) => {
        const selling = ctx.get('general.sellingLocations') ?? 'all'
        const shipTo = ctx.get('general.shipTo') ?? 'all_selling'
        return (
          <>
            <Field label="Selling location(s)">
              <ChoiceCards options={SELLING_LOCATIONS} value={selling} onChange={(v) => ctx.set('general.sellingLocations', v)} />
            </Field>
            {selling === 'all_except' && (
              <Field label="Sell to all countries, except">
                <CountryChips value={ctx.get('general.sellingExcept')} onChange={(v) => ctx.set('general.sellingExcept', v)} />
              </Field>
            )}
            {selling === 'specific' && (
              <Field label="Sell to these countries">
                <CountryChips value={ctx.get('general.sellingSpecific')} onChange={(v) => ctx.set('general.sellingSpecific', v)} />
              </Field>
            )}
            <Field label="Shipping location(s)" help="Choosing “Disable shipping” also removes the shipping wizard from your task list.">
              <Select options={SHIP_TO} value={shipTo} onChange={(v) => ctx.set('general.shipTo', v)} />
            </Field>
            {shipTo === 'specific' && (
              <Field label="Ship to these countries">
                <CountryChips value={ctx.get('general.shipToSpecific')} onChange={(v) => ctx.set('general.shipToSpecific', v)} />
              </Field>
            )}
            <Field label="Default customer location" help="Used to estimate tax and shipping before the customer enters an address.">
              <Select options={CUSTOMER_LOCATION} value={ctx.get('general.defaultCustomerLocation') ?? 'base'} onChange={(v) => ctx.set('general.defaultCustomerLocation', v)} />
            </Field>
          </>
        )
      },
      validate: (ctx) =>
        ctx.get('general.sellingLocations') === 'specific' && !(ctx.get('general.sellingSpecific') ?? []).length ? 'Add at least one country you sell to.' : null,
    },
    {
      id: 'currency',
      title: 'How should prices look?',
      description: 'Pick your currency and number format. The preview updates as you go.',
      render: (ctx) => {
        const code = ctx.get('currency.code') ?? 'EUR'
        const preset = LOCALE_FORMATS[code]
        return (
          <div className="ss-split">
            <div>
              <Field label="Currency">
                <Select
                  options={CURRENCIES}
                  value={code}
                  onChange={(v) => {
                    ctx.set('currency.code', v)
                    ctx.set('currency.decimals', currencyDecimals(v))
                  }}
                />
              </Field>
              <Field label="Currency position">
                <Select options={CURRENCY_POSITIONS} value={ctx.get('currency.position') ?? 'left'} onChange={(v) => ctx.set('currency.position', v)} />
              </Field>
              <Row>
                <Field label="Thousand separator">
                  <TextInput value={ctx.get('currency.thousandSeparator')} maxLength={2} onChange={(v) => ctx.set('currency.thousandSeparator', v)} />
                </Field>
                <Field label="Decimal separator">
                  <TextInput value={ctx.get('currency.decimalSeparator')} maxLength={2} onChange={(v) => ctx.set('currency.decimalSeparator', v)} />
                </Field>
                <Field label="Decimals">
                  <NumberInput value={ctx.get('currency.decimals')} min={0} max={4} onChange={(v) => ctx.set('currency.decimals', v ?? 0)} />
                </Field>
              </Row>
              {preset && (
                <Button
                  kind="secondary"
                  onClick={() => {
                    ctx.set('currency.thousandSeparator', preset.thousand)
                    ctx.set('currency.decimalSeparator', preset.decimal)
                    ctx.set('currency.position', preset.position)
                  }}
                >
                  Use the usual {code} format
                </Button>
              )}
            </div>
            <PricePreview ctx={ctx} />
          </div>
        )
      },
      validate: (ctx) =>
        ctx.get('currency.thousandSeparator') && ctx.get('currency.thousandSeparator') === ctx.get('currency.decimalSeparator')
          ? 'Thousand and decimal separators must differ.'
          : null,
    },
  ],
}
