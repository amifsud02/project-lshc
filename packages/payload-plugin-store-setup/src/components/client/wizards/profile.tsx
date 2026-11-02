'use client'

import {
  countryName,
  COUNTRIES,
  currencyForCountry,
  IMPERIAL_COUNTRIES,
  INDUSTRIES,
  PLATFORMS,
  PRODUCT_TYPES,
  REVENUE,
  SELLING_WHERE,
  SETUP_FOR,
  VAT_STANDARD_RATES,
} from '../../../reference'
import { ChoiceCards, Field, Select, TextInput } from '../controls'
import type { StepContext, WizardDef } from '../engine'

/** What the rest of setup will look like, given the answers so far. */
function Plan({ ctx }: { ctx: StepContext }) {
  const country: string | undefined = ctx.get('general.country')
  const types: string[] = ctx.get('profile.productTypes') ?? []
  const physical = types.length === 0 || types.includes('physical') || types.includes('bundles')
  const currency = currencyForCountry(country) ?? ctx.get('currency.code')
  const vat = country ? VAT_STANDARD_RATES[country] : undefined
  const forClient = ctx.get('profile.setupFor') === 'client'
  const items = [
    country && `Prices in ${currency}, store based in ${countryName(country)}.`,
    vat !== undefined ? `Tax wizard will offer the ${vat}% standard rate for ${countryName(country)}.` : 'Tax wizard will help you add your rates by hand.',
    physical ? 'Shipping wizard included — you sell things that need delivering.' : 'Shipping is left out — you only sell things that don’t need delivering.',
    types.includes('downloads') && 'Products wizard will start you on a downloadable product template.',
    types.includes('memberships') && 'Checkout wizard will suggest requiring an account, so members can sign in.',
    ctx.get('profile.sellingWhere') === 'offline' && 'Payments wizard will suggest cash on delivery and local pickup to match how you sell today.',
    forClient && 'Launch wizard will give you a preview link to share with your client before going live.',
  ].filter(Boolean) as string[]
  return (
    <ul className="ss-plan">
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  )
}

export const profileWizard: WizardDef = {
  id: 'store-profile',
  sections: ['profile', 'general', 'currency', 'products'],
  steps: [
    {
      id: 'who',
      title: 'Which one of these best describes you?',
      description: 'We’ll tailor the setup to fit.',
      render: (ctx) => <ChoiceCards options={SETUP_FOR} value={ctx.get('profile.setupFor')} onChange={(v) => ctx.set('profile.setupFor', v)} />,
      validate: (ctx) => (!ctx.get('profile.setupFor') ? 'Pick the option closest to you.' : null),
    },
    {
      id: 'selling',
      title: 'Where are you selling today?',
      when: (ctx) => ctx.get('profile.setupFor') === 'selling',
      render: (ctx) => (
        <>
          <ChoiceCards options={SELLING_WHERE} value={ctx.get('profile.sellingWhere')} onChange={(v) => ctx.set('profile.sellingWhere', v)} />
          {['online', 'both'].includes(ctx.get('profile.sellingWhere')) && (
            <Field label="Which platforms are you selling on?" help="Pick all that apply.">
              <ChoiceCards multiple columns={3} options={PLATFORMS} value={ctx.get('profile.platforms')} onChange={(v) => ctx.set('profile.platforms', v)} />
            </Field>
          )}
          <Field label="Roughly how much do you sell?">
            <Select options={REVENUE} value={ctx.get('profile.revenue')} onChange={(v) => ctx.set('profile.revenue', v)} placeholder="Prefer not to say" />
          </Field>
        </>
      ),
      skippable: true,
    },
    {
      id: 'business',
      title: 'Tell us a bit about your store',
      description: 'We’ll use this to set your currency and suggest tax and shipping options.',
      render: (ctx) => (
        <>
          <Field label="Store name">
            <TextInput value={ctx.get('profile.storeName')} onChange={(v) => ctx.set('profile.storeName', v)} placeholder="e.g. Harbour Supplies" />
          </Field>
          <Field label="Where is your store based?">
            <Select
              options={COUNTRIES}
              value={ctx.get('general.country')}
              placeholder="Choose a country"
              onChange={(v) => {
                ctx.set('general.country', v)
                const currency = currencyForCountry(v)
                if (currency) ctx.set('currency.code', currency)
                // Like WooCommerce's profiler, the country also picks measurement units.
                const imperial = IMPERIAL_COUNTRIES.includes(v)
                ctx.set('products.weightUnit', imperial ? 'lbs' : 'kg')
                ctx.set('products.dimensionUnit', imperial ? 'in' : 'cm')
              }}
            />
          </Field>
          <Field label="In which industry does your store operate?">
            <ChoiceCards columns={2} options={INDUSTRIES} value={ctx.get('profile.industry')} onChange={(v) => ctx.set('profile.industry', v)} />
          </Field>
          {ctx.get('profile.industry') === 'other' && (
            <Field label="Your industry">
              <TextInput value={ctx.get('profile.industryOther')} onChange={(v) => ctx.set('profile.industryOther', v)} />
            </Field>
          )}
        </>
      ),
      validate: (ctx) => (!ctx.get('profile.storeName') ? 'Give your store a name.' : !ctx.get('general.country') ? 'Choose where your store is based.' : null),
    },
    {
      id: 'products',
      title: 'What do you plan to sell?',
      description: 'Pick everything that applies — it decides which wizards you’ll see.',
      render: (ctx) => (
        <ChoiceCards multiple columns={3} options={PRODUCT_TYPES} value={ctx.get('profile.productTypes')} onChange={(v) => ctx.set('profile.productTypes', v)} />
      ),
      validate: (ctx) => ((ctx.get('profile.productTypes') ?? []).length === 0 ? 'Pick at least one.' : null),
    },
    {
      id: 'plan',
      title: 'Here’s your setup plan',
      description: 'Based on your answers. Change anything later in Store Settings.',
      render: (ctx) => <Plan ctx={ctx} />,
      cta: 'Take me to store setup',
    },
  ],
  finishPatch: () => ({ profile: { completedAt: new Date().toISOString() } }),
  doneMessage: (ctx) => `Thanks${ctx.get('profile.storeName') ? `, ${ctx.get('profile.storeName')}` : ''}! Your task list is now tailored to your store.`,
}
