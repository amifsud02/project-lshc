import sgMail from '@sendgrid/mail'
import { getPayload } from 'payload'
import config from '@payload-config'
import { dayLabel, formatTimeRange, sortSessions } from '@/lib/nursery/schedule'

const apiKey = process.env.SENDGRID_API_KEY
const fromEmail = process.env.SENDGRID_FROM_EMAIL
const fromName = process.env.SENDGRID_FROM_NAME ?? 'La Salle Handball'

if (apiKey) {
  sgMail.setApiKey(apiKey)
}

const formatCents = (cents: number) =>
  new Intl.NumberFormat('en-MT', { style: 'currency', currency: 'EUR' }).format((cents ?? 0) / 100)

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

export type RegistrationEmailKind = 'paid' | 'awaiting-transfer'

/**
 * Sent twice at most: once when a bank-transfer registration is taken (with the
 * account details) and once when the fee lands. Card registrations only ever get
 * the second one, fired by the `paid` transition in the collection hook.
 */
export async function sendRegistrationEmail(
  registration: any,
  kind: RegistrationEmailKind,
): Promise<void> {
  if (!apiKey || !fromEmail) {
    console.warn('[email] SENDGRID_API_KEY or SENDGRID_FROM_EMAIL missing; skipping send')
    return
  }
  const to = registration?.parent?.email
  if (!to) return

  const payload = await getPayload({ config })

  // The registration stores relationship IDs; pull the season and category so the
  // email can restate the schedule the parent just signed up to.
  const seasonId =
    typeof registration.season === 'object' ? registration.season?.id : registration.season
  const categoryId =
    typeof registration.category === 'object' ? registration.category?.id : registration.category

  const season =
    typeof registration.season === 'object' && registration.season?.title
      ? registration.season
      : seasonId
        ? await payload.findByID({ collection: 'nursery-seasons', id: seasonId, depth: 0 }).catch(() => null)
        : null

  const category =
    typeof registration.category === 'object' && registration.category?.sessions
      ? registration.category
      : categoryId
        ? await payload
            .findByID({ collection: 'nursery-categories', id: categoryId, depth: 1 })
            .catch(() => null)
        : null

  const childName = `${registration.child?.firstName ?? ''} ${registration.child?.lastName ?? ''}`.trim()
  const price = formatCents(registration.fee?.priceCents ?? 0)

  const sessions = sortSessions(((category?.sessions ?? []) as any[]) ?? [])
  const sessionRows = sessions
    .map((session) => {
      const venue = typeof session.venue === 'object' ? session.venue?.name : ''
      return `<tr>
        <td style="padding:6px 12px 6px 0;border-bottom:1px solid #eee;">${escapeHtml(dayLabel(session.day))}</td>
        <td style="padding:6px 12px 6px 0;border-bottom:1px solid #eee;">${escapeHtml(formatTimeRange(session.startTime, session.endTime))}</td>
        <td style="padding:6px 0;border-bottom:1px solid #eee;">${escapeHtml(venue)}</td>
      </tr>`
    })
    .join('')

  const bank = season?.bankTransfer ?? {}
  const bankBlock =
    kind === 'awaiting-transfer'
      ? `
      <div style="margin-top:20px;padding:16px;background:#faf7f2;border:1px solid #e6ddd0;">
        <h2 style="font-size:15px;margin:0 0 8px;">How to pay</h2>
        <p style="margin:0 0 8px;color:#555;font-size:14px;">
          Please transfer <strong>${escapeHtml(price)}</strong> quoting reference
          <strong>${escapeHtml(registration.registrationNumber)}</strong>.
        </p>
        ${bank.accountName ? `<p style="margin:0;font-size:14px;">Account: ${escapeHtml(bank.accountName)}</p>` : ''}
        ${bank.iban ? `<p style="margin:0;font-size:14px;">IBAN: ${escapeHtml(bank.iban)}</p>` : ''}
        ${bank.swift ? `<p style="margin:0;font-size:14px;">BIC/SWIFT: ${escapeHtml(bank.swift)}</p>` : ''}
        ${bank.instructions ? `<p style="margin:8px 0 0;color:#555;font-size:13px;">${escapeHtml(bank.instructions)}</p>` : ''}
      </div>`
      : ''

  const headline =
    kind === 'paid'
      ? `${childName} is registered`
      : `We've received ${childName}'s registration`

  const lead =
    kind === 'paid'
      ? `The fee of ${price} has been received. Nothing further is needed.`
      : `The place is held pending payment of ${price}.`

  const contact = season?.contact ?? {}

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111;">
      <h1 style="font-size:22px;margin:0 0 8px;">${escapeHtml(headline)}</h1>
      <p style="margin:0 0 16px;color:#555;">
        ${escapeHtml(lead)} Reference <strong>${escapeHtml(registration.registrationNumber)}</strong>.
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:6px 12px 6px 0;color:#777;">Season</td><td>${escapeHtml(season?.title ?? '')}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#777;">Group</td><td>${escapeHtml(category?.name ?? '')}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#777;">Registered for</td><td>${escapeHtml(registration.fee?.tierLabel ?? '')}</td></tr>
      </table>
      ${bankBlock}
      ${
        sessionRows
          ? `<h2 style="font-size:15px;margin:24px 0 8px;">Training schedule</h2>
             <table style="width:100%;border-collapse:collapse;font-size:14px;">${sessionRows}</table>`
          : ''
      }
      ${
        season?.firstTrainingDate
          ? `<p style="margin-top:16px;color:#555;font-size:14px;">Training starts the week beginning ${escapeHtml(
              new Date(season.firstTrainingDate).toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              }),
            )}.</p>`
          : ''
      }
      <p style="margin-top:24px;color:#555;font-size:13px;">
        Any questions, contact ${escapeHtml(contact.name ?? 'the Club')}${contact.phone ? ` on ${escapeHtml(contact.phone)}` : ''}${contact.email ? ` or at ${escapeHtml(contact.email)}` : ''}.
      </p>
    </div>
  `

  const text = [
    headline,
    lead,
    `Reference: ${registration.registrationNumber}`,
    `Season: ${season?.title ?? ''}`,
    `Group: ${category?.name ?? ''}`,
    `Registered for: ${registration.fee?.tierLabel ?? ''}`,
    ...(kind === 'awaiting-transfer'
      ? [
          '',
          'How to pay:',
          bank.accountName ? `Account: ${bank.accountName}` : '',
          bank.iban ? `IBAN: ${bank.iban}` : '',
          bank.swift ? `BIC/SWIFT: ${bank.swift}` : '',
          `Reference: ${registration.registrationNumber}`,
          bank.instructions ?? '',
        ].filter(Boolean)
      : []),
    '',
    'Training schedule:',
    ...sessions.map((session: any) => {
      const venue = typeof session.venue === 'object' ? session.venue?.name : ''
      return `- ${dayLabel(session.day)} ${formatTimeRange(session.startTime, session.endTime)} — ${venue}`
    }),
  ]
    .filter(Boolean)
    .join('\n')

  await sgMail.send({
    to,
    from: { email: fromEmail, name: fromName },
    subject:
      kind === 'paid'
        ? `Registration confirmed · ${registration.registrationNumber}`
        : `Registration received · ${registration.registrationNumber}`,
    text,
    html,
  })
}
