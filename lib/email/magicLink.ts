import sgMail from '@sendgrid/mail'

const apiKey = process.env.SENDGRID_API_KEY
const fromEmail = process.env.SENDGRID_FROM_EMAIL
const fromName = process.env.SENDGRID_FROM_NAME ?? 'La Salle Handball'

if (apiKey) {
  sgMail.setApiKey(apiKey)
}

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

export const isMagicLinkEmailConfigured = (): boolean => Boolean(apiKey && fromEmail)

/**
 * Sends the one-time sign-in link. Outside production, when SendGrid is not
 * configured, the link is printed to the server console instead so the flow can
 * be exercised locally.
 */
export async function sendMagicLinkEmail({
  email,
  expiresAt,
  url,
}: {
  email: string
  expiresAt: Date
  url: string
}): Promise<void> {
  const minutes = Math.max(1, Math.round((expiresAt.getTime() - Date.now()) / 60000))

  if (!isMagicLinkEmailConfigured()) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[email] SENDGRID_API_KEY or SENDGRID_FROM_EMAIL missing; magic link not sent')
      return
    }
    console.info(`\n[magic link] Sign-in link for ${email} (valid ${minutes} min):\n${url}\n`)
    return
  }

  const safeUrl = escapeHtml(url)

  const html = `
    <div style="background:#f5f5f5;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#000d24;">
      <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e6e8ee;">
        <div style="background:linear-gradient(95deg,#01296f 10%,#000d24 90%);padding:22px 28px;color:#ffffff;font-weight:800;font-size:15px;letter-spacing:0.14em;text-transform:uppercase;">
          La Salle Handball
        </div>
        <div style="padding:28px;">
          <h1 style="font-size:22px;margin:0 0 10px;">Your sign-in link</h1>
          <p style="margin:0 0 22px;color:#5a667a;line-height:1.6;">
            Tap the button below to sign in. No password needed. The link works once and expires in ${minutes} minutes.
          </p>
          <p style="margin:0 0 26px;">
            <a href="${safeUrl}" style="display:inline-block;background:#01296f;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 24px;border-radius:10px;">
              Sign in to La Salle Handball
            </a>
          </p>
          <p style="margin:0 0 8px;color:#5a667a;font-size:13px;line-height:1.6;">
            If the button does not work, copy this address into your browser:
          </p>
          <p style="margin:0 0 22px;font-size:12px;word-break:break-all;color:#01296f;">${safeUrl}</p>
          <p style="margin:0;color:#8a93a6;font-size:12px;line-height:1.6;">
            Didn't ask for this? You can safely ignore this email. Nobody can sign in without the link.
          </p>
        </div>
      </div>
    </div>
  `

  const text = [
    'Your sign-in link for La Salle Handball',
    '',
    `Open this link to sign in (valid for ${minutes} minutes, works once):`,
    url,
    '',
    "Didn't ask for this? You can safely ignore this email.",
  ].join('\n')

  await sgMail.send({
    to: email,
    from: { email: fromEmail!, name: fromName },
    subject: 'Your sign-in link · La Salle Handball',
    text,
    html,
  })
}
