import type { Payload } from 'payload'
import { summarizeOrderFor } from '@/lib/shop/orderQuestions'
import type { OrderSummary } from '@/lib/shop/orderSummary'
import type { ShopSettings } from '@/lib/shop/settings'
import { footerFromPayload, generalFromPayload } from '@/lib/utils/normalize/globals'
import { SITE_URL } from '@/lib/seo/site'
import { button, callout, formatCents, keyValues, paragraph, renderLayout, rowsHtml, type Row } from './layout'

export const SHOP_EMAILS = {
  confirmation: { label: 'Order confirmation', to: 'Buyer', when: 'Order is paid' },
  staff: { label: 'New order alert', to: 'Shop staff', when: 'Order is paid' },
  ready: { label: 'Ready to collect', to: 'Buyer', when: 'Status set to Ready to collect' },
  shipped: { label: 'Order shipped', to: 'Buyer', when: 'Status set to Shipped' },
  refund: { label: 'Refund', to: 'Buyer', when: 'Order is refunded' },
} as const

export type ShopEmailKind = keyof typeof SHOP_EMAILS

export type RenderedEmail = { to: string[]; replyTo?: string; subject: string; html: string; text: string }

type Context = {
  order: any
  summary: OrderSummary
  shop: ShopSettings
  staffEmails: string[]
  clubName: string
  contactEmail?: string
}

async function loadContext(payload: Payload, order: any): Promise<Context> {
  const [general, footer, summary] = await Promise.all([
    payload.findGlobal({ slug: 'general', depth: 0 }),
    payload.findGlobal({ slug: 'footer', depth: 0 }),
    summarizeOrderFor(payload, order.items ?? []),
  ])
  const { shop } = generalFromPayload(general)
  const { clubName, contact } = footerFromPayload(footer)
  const staffEmails = String((general as any)?.shop?.staffEmails ?? '')
    .split(/[\s,;]+/)
    .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
  return { order, summary, shop, staffEmails, clubName, contactEmail: contact.email }
}

const money = (ctx: Context, cents: number) => formatCents(cents, ctx.order.currency ?? 'eur')
const firstName = (order: any) => String(order.customerName ?? '').trim().split(/\s+/)[0] || 'there'
const answers = (list: { label: string; value: string }[]) => list.map((a) => `${a.label}: ${a.value}`).join(' · ')

/** What was bought, then the money lines. */
function itemRows(ctx: Context): Row[] {
  const { membership, lines } = ctx.summary
  const rows: Row[] = []
  if (membership) {
    rows.push({ label: `${membership.title} (${membership.season})`, amount: money(ctx, membership.price) })
    for (const m of membership.members) {
      rows.push({ label: m.name, detail: answers([...m.answers, ...m.items.map((it) => ({ label: it.title, value: answers(it.answers) || 'included' }))]), indent: true })
    }
  }
  for (const l of lines) {
    rows.push({
      label: `${l.title}${l.quantity > 1 ? ` × ${l.quantity}` : ''}`,
      detail: answers(l.answers) || undefined,
      amount: l.lineTotal > 0 ? money(ctx, l.lineTotal) : l.included ? 'Included' : '',
      indent: l.included,
    })
  }
  return rows
}

function totalRows(ctx: Context): Row[] {
  const o = ctx.order
  const delivery = Number(o.deliveryFee) || 0
  const discount = Number(o.discountTotal) || 0
  const taxAdded = Number(o.taxAdded) || 0
  const fee = (Number(o.total) || 0) - (Number(o.subtotal) || 0) - delivery + discount - taxAdded
  const rows: Row[] = []
  if (o.fulfilment?.method === 'deliver') rows.push({ label: o.fulfilment?.methodTitle || 'Delivery', amount: delivery ? money(ctx, delivery) : 'Free' })
  else if (o.paymentProvider !== 'membrs') rows.push({ label: o.fulfilment?.methodTitle || 'Collection at the club', amount: delivery ? money(ctx, delivery) : 'Free' })
  if (discount > 0) rows.push({ label: o.couponCode ? `Coupon ${String(o.couponCode).toUpperCase()}` : 'Promo code', amount: `−${money(ctx, discount)}` })
  if (taxAdded > 0) rows.push({ label: 'Tax', amount: money(ctx, taxAdded) })
  if (fee > 0) rows.push({ label: o.paymentProvider === 'membrs' ? 'Rypple platform fee' : 'Other charges', amount: money(ctx, fee) })
  rows.push({ label: 'Total paid', amount: money(ctx, Number(o.total) || 0), strong: true })
  if (Number(o.vatIncluded) > 0) rows.push({ label: 'Includes VAT', amount: money(ctx, Number(o.vatIncluded)), muted: true })
  return rows
}

const addressOf = (o: any) =>
  [o.fulfilment?.addressLine1, o.fulfilment?.addressLine2, [o.fulfilment?.locality, o.fulfilment?.postcode].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ')

function nextStep(ctx: Context): [string, string] {
  const o = ctx.order
  if (o.paymentProvider === 'membrs') return ['Your membership card', 'Rypple emails each member their digital card. Show it at the club to use member benefits.']
  if (o.fulfilment?.method === 'deliver') return ['Delivery', `We'll deliver to ${addressOf(o)}${ctx.shop.delivery.details ? ` (${ctx.shop.delivery.details})` : ''} and email you when it's on its way.`]
  return [
    'Collecting your order',
    `We'll email you when it's ready${ctx.shop.collection.readyIn ? `, usually within ${ctx.shop.collection.readyIn}` : ''}. ${ctx.shop.collection.details} Bring your order number.`,
  ]
}

/** Seller details and cancellation rights: the order confirmation is the buyer's durable record of the sale. */
function legalFooter(ctx: Context): string[] {
  return [
    [ctx.clubName, 'Malta', ctx.contactEmail].filter(Boolean).join(' · '),
    // Goods carry the 14-day right to cancel; memberships are handled by Rypple's own terms.
    ...(ctx.order.paymentProvider === 'membrs'
      ? []
      : ["You can cancel items that aren't personalised within 14 days of receiving them. Reply to this email to do so. Personalised items can't be returned."]),
    ...(ctx.shop.termsUrl ? [`Terms of sale: ${absolute(ctx.shop.termsUrl)}`] : []),
  ]
}

const absolute = (url: string) => (url.startsWith('http') ? url : `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`)
const textRows = (rows: Row[]) => rows.map((r) => `${r.indent ? '  ' : ''}${r.label}${r.detail ? ` (${r.detail})` : ''}${r.amount ? ` — ${r.amount}` : ''}`)

function build(ctx: Context, kind: ShopEmailKind): RenderedEmail {
  const o = ctx.order
  const num = String(o.orderNumber ?? '')
  const shell = (heading: string, preheader: string, body: string, footer = legalFooter(ctx)) =>
    renderLayout({ heading, preheader, body, footer, siteUrl: SITE_URL, clubName: ctx.clubName })
  const buyer = o.customerEmail ? [String(o.customerEmail)] : []

  switch (kind) {
    case 'confirmation': {
      const [title, body] = nextStep(ctx)
      const rows = [...itemRows(ctx), ...totalRows(ctx)]
      return {
        to: buyer,
        subject: `Order confirmed · ${num}`,
        html: shell(
          `Thanks for your order, ${firstName(o)}`,
          `Order ${num} is paid. ${title}.`,
          paragraph(`Order ${num} · paid ${dateOf(o.paidAt)}`) + rowsHtml(rows) + callout(title, body) + paragraph('Questions? Just reply to this email.'),
        ),
        text: [`Thanks for your order, ${firstName(o)}`, `Order ${num} · paid ${dateOf(o.paidAt)}`, '', ...textRows(rows), '', `${title}: ${body}`, '', ...legalFooter(ctx)].join('\n'),
      }
    }
    case 'staff': {
      const method = o.paymentProvider === 'membrs' ? 'Membership (Rypple)' : o.fulfilment?.method === 'deliver' ? `Deliver to ${addressOf(o)}` : 'Collect at the club'
      const pairs: [string, string][] = [
        ['Buyer', String(o.customerName || o.customerEmail)],
        ['Contact', [o.customerEmail, o.customerPhone].filter(Boolean).join(' · ')],
        ['Handover', method],
        ...(o.fulfilment?.note ? [['Note', String(o.fulfilment.note)] as [string, string]] : []),
        ['Total', money(ctx, Number(o.total) || 0)],
      ]
      const rows = itemRows(ctx)
      const link = `${SITE_URL}/admin/collections/orders/${o.id}`
      return {
        to: ctx.staffEmails,
        subject: `New order ${num} · ${money(ctx, Number(o.total) || 0)} · ${o.fulfilment?.method === 'deliver' ? 'Delivery' : o.paymentProvider === 'membrs' ? 'Membership' : 'Collect'}`,
        html: shell(`New order ${num}`, `${o.customerName || o.customerEmail} paid ${money(ctx, Number(o.total) || 0)}.`, keyValues(pairs) + rowsHtml(rows) + `<div style="margin-top:18px;">${button('Open the order', link)}</div>`, [
          `Sent to the shop staff list in Site Settings → Shop.`,
        ]),
        text: [`New order ${num}`, ...pairs.map(([k, v]) => `${k}: ${v}`), '', ...textRows(rows), '', link].join('\n'),
      }
    }
    case 'ready': {
      const body = `${ctx.shop.collection.details} Bring your order number (${num}) or this email.`
      const rows = itemRows(ctx)
      return {
        to: buyer,
        subject: `Ready to collect · ${num}`,
        html: shell(`Your order is ready, ${firstName(o)}`, 'Your order is ready to collect at the club.', callout('Where to collect', body) + rowsHtml(rows)),
        text: [`Your order is ready, ${firstName(o)}`, body, '', ...textRows(rows)].join('\n'),
      }
    }
    case 'shipped': {
      const body = `It's on its way to ${addressOf(o)}.${ctx.shop.delivery.details ? ` ${ctx.shop.delivery.details}.` : ''}`
      const rows = itemRows(ctx)
      return {
        to: buyer,
        subject: `On its way · ${num}`,
        html: shell(`Your order is on its way, ${firstName(o)}`, body, callout('Delivery', body) + rowsHtml(rows)),
        text: [`Your order is on its way, ${firstName(o)}`, body, '', ...textRows(rows)].join('\n'),
      }
    }
    case 'refund': {
      const amount = money(ctx, Number(o.total) || 0)
      const body = `We've refunded ${amount} to the card or wallet you paid with. Banks usually take 5–10 working days to show it.`
      return {
        to: buyer,
        subject: `Refund for order ${num}`,
        html: shell(`Your refund is on its way`, `${amount} refunded for order ${num}.`, paragraph(body) + rowsHtml(itemRows(ctx)) + paragraph('Questions? Just reply to this email.')),
        text: [`Your refund is on its way`, body, '', ...textRows(itemRows(ctx))].join('\n'),
      }
    }
  }
}

const dateOf = (value: unknown) =>
  new Intl.DateTimeFormat('en-MT', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Malta' }).format(
    value ? new Date(String(value)) : new Date(),
  )

export async function renderShopEmail(payload: Payload, kind: ShopEmailKind, order: any): Promise<RenderedEmail> {
  const ctx = await loadContext(payload, order)
  // Buyers reply to the club, not to the sending address.
  return { ...build(ctx, kind), replyTo: kind === 'staff' ? undefined : ctx.contactEmail }
}

/**
 * Sends one of the shop emails for an order. `to` overrides the recipients (test sends);
 * returns false when there's nobody to send to, e.g. no staff list set.
 */
export async function sendShopEmail(
  payload: Payload,
  kind: ShopEmailKind,
  order: any,
  options: { to?: string; test?: boolean } = {},
): Promise<boolean> {
  const email = await renderShopEmail(payload, kind, order)
  const to = options.to ? [options.to] : email.to
  if (to.length === 0) return false
  await payload.sendEmail({
    to,
    subject: options.test ? `[TEST] ${email.subject}` : email.subject,
    html: email.html,
    text: email.text,
    replyTo: email.replyTo,
  })
  return true
}

/** A made-up paid order for previews when there are no real ones. */
export const SAMPLE_ORDER = {
  id: 'sample',
  orderNumber: 'LSH-SAMPLE-0001',
  status: 'paid',
  paidAt: new Date().toISOString(),
  customerName: 'Sample Buyer',
  customerEmail: 'buyer@example.com',
  customerPhone: '+356 7900 0000',
  paymentProvider: 'club',
  currency: 'eur',
  fulfilment: { method: 'collect', note: 'Collecting for my daughter, U14 girls' },
  items: [
    { productTitle: 'Club T-Shirt', quantity: 1, unitPrice: 1000, customFieldValues: { size: 'M' } },
    { productTitle: 'Club T-Shirt', quantity: 1, unitPrice: 1000, customFieldValues: { size: 'L' } },
    { productTitle: 'Club Hoodie', quantity: 1, unitPrice: 3000, customFieldValues: { size: 'L' } },
  ],
  subtotal: 5000,
  deliveryFee: 0,
  discountTotal: 0,
  vatIncluded: 0,
  total: 5000,
}
