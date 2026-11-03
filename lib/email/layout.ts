/**
 * The club's email shell and the pieces emails are built from. Table layout and inline styles,
 * because email clients ignore most CSS.
 */

export const NAVY = '#01296f'
const INK = '#0d1a33'
const MUTED = '#5a6580'
const LINE = '#e6e9f0'

export const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

export const formatCents = (cents: number, currency = 'eur') =>
  new Intl.NumberFormat('en-MT', { style: 'currency', currency: currency.toUpperCase() }).format((cents ?? 0) / 100)

export type Row = { label: string; detail?: string; amount?: string; indent?: boolean; strong?: boolean; muted?: boolean }

/** Lines of an order or a totals block: label (with an optional detail line) and an amount. */
export const rowsHtml = (rows: Row[]) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${rows
    .map(
      (r) => `<tr>
  <td style="padding:9px 0;border-bottom:1px solid ${LINE};vertical-align:top;${r.indent ? 'padding-left:16px;' : ''}">
    <div style="font-size:14px;color:${r.muted ? MUTED : INK};${r.strong ? 'font-weight:700;' : r.indent ? '' : 'font-weight:600;'}">${escapeHtml(r.label)}</div>
    ${r.detail ? `<div style="font-size:13px;color:${MUTED};margin-top:2px;">${escapeHtml(r.detail)}</div>` : ''}
  </td>
  <td style="padding:9px 0 9px 12px;border-bottom:1px solid ${LINE};vertical-align:top;text-align:right;white-space:nowrap;font-size:14px;color:${r.muted ? MUTED : INK};${r.strong ? 'font-weight:700;' : ''}">${escapeHtml(r.amount ?? '')}</td>
</tr>`,
    )
    .join('')}</table>`

export const paragraph = (text: string) => `<p style="margin:0 0 14px;font-size:14px;line-height:1.55;color:${MUTED};">${escapeHtml(text)}</p>`

/** A tinted box for the one thing the reader needs to do or know next. */
export const callout = (title: string, body: string) =>
  `<div style="background:#eef1f7;padding:14px 16px;margin:18px 0;">
  <div style="font-size:14px;font-weight:700;color:${NAVY};margin-bottom:4px;">${escapeHtml(title)}</div>
  <div style="font-size:14px;line-height:1.5;color:${INK};">${escapeHtml(body)}</div>
</div>`

export const button = (label: string, href: string) =>
  `<a href="${escapeHtml(href)}" style="display:inline-block;background:${NAVY};color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:11px 18px;margin:6px 0 4px;">${escapeHtml(label)}</a>`

export const keyValues = (pairs: [string, string][]) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 14px;">${pairs
    .map(
      ([k, v]) =>
        `<tr><td style="padding:3px 16px 3px 0;font-size:13px;color:${MUTED};vertical-align:top;">${escapeHtml(k)}</td><td style="padding:3px 0;font-size:14px;color:${INK};">${escapeHtml(v)}</td></tr>`,
    )
    .join('')}</table>`

export type Layout = {
  /** Shown by inbox previews next to the subject. */
  preheader: string
  heading: string
  body: string
  /** Small print under the email, e.g. the seller's details and cancellation rights. */
  footer: string[]
  siteUrl: string
  clubName: string
}

export const renderLayout = ({ preheader, heading, body, footer, siteUrl, clubName }: Layout) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(heading)}</title></head>
<body style="margin:0;padding:0;background:#eef1f6;font-family:Manrope,Helvetica,Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef1f6;padding:24px 12px;">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;overflow:hidden;border:1px solid ${LINE};">
    <tr><td style="background:${NAVY};padding:16px 24px;">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="padding-right:12px;"><img src="${escapeHtml(siteUrl)}/lshc.png" width="40" height="40" alt="" style="display:block;border-radius:50%;background:#ffffff;"></td>
        <td style="color:#ffffff;font-size:16px;font-weight:700;">${escapeHtml(clubName)}</td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:26px 24px 10px;">
      <h1 style="margin:0 0 12px;font-size:21px;line-height:1.25;color:${INK};">${escapeHtml(heading)}</h1>
      ${body}
    </td></tr>
    <tr><td style="padding:16px 24px 20px;background:#f7f8fb;border-top:1px solid ${LINE};font-size:12px;line-height:1.55;color:${MUTED};">
      ${footer.map((line) => `<div style="margin-bottom:4px;">${escapeHtml(line)}</div>`).join('')}
    </td></tr>
  </table>
</td></tr>
</table>
</body></html>`
