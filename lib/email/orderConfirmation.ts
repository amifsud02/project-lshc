import sgMail from '@sendgrid/mail'

const apiKey = process.env.SENDGRID_API_KEY
const fromEmail = process.env.SENDGRID_FROM_EMAIL
const fromName = process.env.SENDGRID_FROM_NAME ?? 'La Salle Handball'

if (apiKey) {
  sgMail.setApiKey(apiKey)
}

const formatCents = (cents: number, currency = 'eur') =>
  new Intl.NumberFormat('en-MT', { style: 'currency', currency: currency.toUpperCase() }).format(
    (cents ?? 0) / 100,
  )

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

export async function sendOrderConfirmation(order: any): Promise<void> {
  if (!apiKey || !fromEmail) {
    console.warn('[email] SENDGRID_API_KEY or SENDGRID_FROM_EMAIL missing; skipping send')
    return
  }
  if (!order?.customerEmail) return

  const items: any[] = Array.isArray(order.items) ? order.items : []
  const currency = order.currency ?? 'eur'

  const itemsHtml = items
    .map((item) => {
      const fields = item.customFieldValues ?? {}
      const fieldEntries = Object.entries(fields)
        .map(([k, v]) => `<li><strong>${escapeHtml(k)}:</strong> ${escapeHtml(v)}</li>`)
        .join('')
      const isChild = Boolean(item.bundleParentLineId)
      const unitPrice = item.unitPrice ?? 0
      const priceCell = unitPrice > 0 ? formatCents(unitPrice * (item.quantity ?? 1), currency) : ''
      const titleStyle = isChild
        ? 'font-weight:400;color:#555;padding-left:16px;'
        : 'font-weight:700;'
      const prefix = isChild ? '↳ ' : ''
      return `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee;vertical-align:top;">
            <div style="${titleStyle}">${prefix}${escapeHtml(item.productTitle)} × ${escapeHtml(item.quantity ?? 1)}</div>
            ${fieldEntries ? `<ul style="margin:4px 0 0 ${isChild ? 28 : 16}px;padding:0;font-size:13px;color:#555;">${fieldEntries}</ul>` : ''}
          </td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;vertical-align:top;">
            ${priceCell}
          </td>
        </tr>
      `
    })
    .join('')

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111;">
      <h1 style="font-size:22px;margin:0 0 8px;">Thanks for your order!</h1>
      <p style="margin:0 0 16px;color:#555;">Order <strong>${escapeHtml(order.orderNumber)}</strong> has been received.</p>
      <table style="width:100%;border-collapse:collapse;">${itemsHtml}</table>
      <div style="margin-top:16px;display:flex;justify-content:space-between;font-weight:700;">
        <span>Total</span>
        <span>${formatCents(order.total ?? 0, currency)}</span>
      </div>
      <p style="margin-top:24px;color:#555;font-size:13px;">
        We'll be in touch with next steps. Reply to this email if you have any questions.
      </p>
    </div>
  `

  const text = [
    `Thanks for your order!`,
    `Order ${order.orderNumber}`,
    ...items.map((i) => {
      const isChild = Boolean(i.bundleParentLineId)
      const price = (i.unitPrice ?? 0) > 0
        ? ` — ${formatCents((i.unitPrice ?? 0) * (i.quantity ?? 1), currency)}`
        : ''
      return `${isChild ? '    ↳ ' : '- '}${i.productTitle} × ${i.quantity ?? 1}${price}`
    }),
    `Total: ${formatCents(order.total ?? 0, currency)}`,
  ].join('\n')

  await sgMail.send({
    to: order.customerEmail,
    from: { email: fromEmail, name: fromName },
    subject: `Order confirmation · ${order.orderNumber}`,
    text,
    html,
  })
}
