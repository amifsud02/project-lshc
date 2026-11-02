'use client'

import { STOCK_FORMATS } from '../../../reference'
import { ChoiceCards, Field, NumberInput, Row, TextInput, Toggle } from '../controls'
import type { StepContext, WizardDef } from '../engine'

/** What a shopper sees on a product page at a few stock levels, with the current rules. */
function ShopperView({ ctx }: { ctx: StepContext }) {
  const low = ctx.get('inventory.lowStockThreshold') ?? 2
  const out = ctx.get('inventory.outOfStockThreshold') ?? 0
  const format = ctx.get('inventory.stockFormat') ?? 'always'
  const hide = ctx.get('inventory.hideOutOfStock')
  const label = (qty: number) => {
    if (qty <= out) return hide ? 'Hidden from the shop' : 'Out of stock'
    if (format === 'no_amount') return 'In stock'
    if (format === 'low_amount') return qty <= low ? `Only ${qty} left in stock` : 'In stock'
    return `${qty} in stock`
  }
  const levels = [...new Set([12, low + 1, low, Math.max(out, 0)])].sort((a, b) => b - a)
  return (
    <div className="ss-example">
      <span className="ss-eyebrow">What shoppers see</span>
      <dl>
        {levels.map((qty) => (
          <div key={qty} className="ss-example__row">
            <dt>{qty} left</dt>
            <dd className={qty <= out ? 'is-out' : qty <= low ? 'is-low' : ''}>{label(qty)}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export const inventoryWizard: WizardDef = {
  id: 'inventory',
  sections: ['inventory'],
  steps: [
    {
      id: 'tracking',
      title: 'Do you want to track stock?',
      description: 'Stock tracking stops you selling what you don’t have.',
      render: (ctx) => (
        <>
          <ChoiceCards
            options={[
              { value: 'yes', label: 'Track stock quantities', description: 'Quantities go down with each order; you’re warned when stock runs low.' },
              { value: 'no', label: 'Don’t track stock', description: 'Mark items in or out of stock by hand.' },
            ]}
            value={ctx.get('inventory.manageStock') === false ? 'no' : 'yes'}
            onChange={(v) => ctx.set('inventory.manageStock', v === 'yes')}
          />
          {ctx.get('inventory.manageStock') !== false && (
            <Field label="Hold stock for unpaid orders" help="Reserved stock is released if the order isn’t paid in time. Leave empty to never hold stock.">
              <NumberInput value={ctx.get('inventory.holdStockMinutes')} min={0} suffix="minutes" onChange={(v) => ctx.set('inventory.holdStockMinutes', v)} />
            </Field>
          )}
        </>
      ),
    },
    {
      id: 'alerts',
      title: 'Low stock alerts',
      when: (ctx) => ctx.get('inventory.manageStock') !== false,
      render: (ctx) => (
        <div className="ss-split">
          <div>
            <Toggle label="Email me when stock is low" checked={ctx.get('inventory.notifyLowStock')} onChange={(v) => ctx.set('inventory.notifyLowStock', v)} />
            <Toggle label="Email me when something sells out" checked={ctx.get('inventory.notifyNoStock')} onChange={(v) => ctx.set('inventory.notifyNoStock', v)} />
            <Field label="Send alerts to">
              <TextInput type="email" value={ctx.get('inventory.notificationRecipient') ?? ctx.state.userEmail} onChange={(v) => ctx.set('inventory.notificationRecipient', v)} />
            </Field>
            <Row>
              <Field label="Low stock at">
                <NumberInput value={ctx.get('inventory.lowStockThreshold')} min={0} onChange={(v) => ctx.set('inventory.lowStockThreshold', v ?? 0)} />
              </Field>
              <Field label="Out of stock at">
                <NumberInput value={ctx.get('inventory.outOfStockThreshold')} min={0} onChange={(v) => ctx.set('inventory.outOfStockThreshold', v ?? 0)} />
              </Field>
            </Row>
          </div>
          <ShopperView ctx={ctx} />
        </div>
      ),
      validate: (ctx) =>
        (ctx.get('inventory.lowStockThreshold') ?? 0) < (ctx.get('inventory.outOfStockThreshold') ?? 0) ? 'The low stock level should be at or above the out of stock level.' : null,
    },
    {
      id: 'display',
      title: 'How stock appears in the shop',
      render: (ctx) => (
        <div className="ss-split">
          <div>
            <ChoiceCards options={STOCK_FORMATS} value={ctx.get('inventory.stockFormat') ?? 'always'} onChange={(v) => ctx.set('inventory.stockFormat', v)} />
            <Toggle label="Hide out of stock items from the catalogue" checked={ctx.get('inventory.hideOutOfStock')} onChange={(v) => ctx.set('inventory.hideOutOfStock', v)} />
          </div>
          <ShopperView ctx={ctx} />
        </div>
      ),
    },
  ],
}
