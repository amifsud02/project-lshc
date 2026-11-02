'use client'

import { ColorInput, Field, TextInput, Toggle } from '../controls'
import type { StepContext, WizardDef } from '../engine'
import { ImageUpload, imageUrl } from '../ImageUpload'

const SWATCHES = ['#111827', '#1d4ed8', '#047857', '#b91c1c', '#7c3aed', '#c2410c', '#0f766e', '#be185d']

/** A tiny storefront header showing the logo, colour, tagline and notice bar. */
function StorefrontPreview({ ctx }: { ctx: StepContext }) {
  const color = ctx.get('brand.primaryColor') || '#111827'
  const logo = imageUrl(ctx.get('brand.logo'))
  const notice = ctx.get('brand.storeNotice') ?? {}
  return (
    <div className="ss-store">
      {notice.enabled && (
        <div className="ss-store__notice" style={{ background: color }}>
          {notice.text}
          {notice.dismissible && <span aria-hidden> ×</span>}
        </div>
      )}
      <div className="ss-store__bar">
        {logo ? <img src={logo} alt="" /> : <strong>{ctx.get('profile.storeName') || 'Your store'}</strong>}
        <span>Shop · About · Cart</span>
      </div>
      <div className="ss-store__hero">
        <h3>{ctx.get('brand.tagline') || 'Your tagline here'}</h3>
        <span className="ss-store__cta" style={{ background: color }}>
          Shop now
        </span>
      </div>
      <div className="ss-store__grid" aria-hidden>
        {[1, 2, 3].map((i) => (
          <span key={i}>
            <i />
            <b style={{ color }}>€19.99</b>
          </span>
        ))}
      </div>
    </div>
  )
}

export const brandWizard: WizardDef = {
  id: 'brand',
  sections: ['brand'],
  steps: [
    {
      id: 'identity',
      title: 'Your logo and colour',
      render: (ctx) => (
        <div className="ss-split">
          <div>
            <Field label="Logo" help="A transparent PNG or SVG works best.">
              <ImageUpload ctx={ctx} path="brand.logo" />
            </Field>
            <Field label="Brand colour" help="Used for buttons, prices and the notice bar.">
              <div className="ss-swatches">
                {SWATCHES.map((c) => (
                  <button key={c} type="button" aria-label={c} className={ctx.get('brand.primaryColor') === c ? 'is-on' : ''} style={{ background: c }} onClick={() => ctx.set('brand.primaryColor', c)} />
                ))}
              </div>
              <ColorInput value={ctx.get('brand.primaryColor')} onChange={(v) => ctx.set('brand.primaryColor', v)} />
            </Field>
            <Field label="Tagline">
              <TextInput value={ctx.get('brand.tagline')} placeholder="e.g. Kit for every season" onChange={(v) => ctx.set('brand.tagline', v)} />
            </Field>
          </div>
          <StorefrontPreview ctx={ctx} />
        </div>
      ),
    },
    {
      id: 'notice',
      title: 'Store-wide notice',
      description: 'A bar across the top of every store page — for sales, delivery cut-offs or a “demo store” warning.',
      skippable: true,
      render: (ctx) => (
        <div className="ss-split">
          <div>
            <Toggle label="Show a store notice" checked={ctx.get('brand.storeNotice.enabled')} onChange={(v) => ctx.set('brand.storeNotice.enabled', v)} />
            {ctx.get('brand.storeNotice.enabled') && (
              <>
                <Field label="Notice text">
                  <TextInput value={ctx.get('brand.storeNotice.text')} onChange={(v) => ctx.set('brand.storeNotice.text', v)} />
                </Field>
                <Toggle label="Let shoppers dismiss it" checked={ctx.get('brand.storeNotice.dismissible')} onChange={(v) => ctx.set('brand.storeNotice.dismissible', v)} />
              </>
            )}
          </div>
          <StorefrontPreview ctx={ctx} />
        </div>
      ),
    },
  ],
}
