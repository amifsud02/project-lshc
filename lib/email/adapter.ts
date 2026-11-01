import sgMail from '@sendgrid/mail'
import type { EmailAdapter } from 'payload'

/**
 * Sends Payload's email (`payload.sendEmail`, auth emails, shop emails) through SendGrid, the
 * provider the site already uses. Without SENDGRID_API_KEY / SENDGRID_FROM_EMAIL it logs
 * the email instead, so local runs never send anything.
 */
export const sendgridAdapter = (): EmailAdapter => ({ payload }) => {
  const apiKey = process.env.SENDGRID_API_KEY
  const fromEmail = process.env.SENDGRID_FROM_EMAIL
  const fromName = process.env.SENDGRID_FROM_NAME ?? 'La Salle Handball'
  if (apiKey) sgMail.setApiKey(apiKey)

  return {
    name: 'sendgrid',
    defaultFromAddress: fromEmail ?? 'no-reply@lasallehandball.com',
    defaultFromName: fromName,
    sendEmail: async (message) => {
      if (!apiKey || !fromEmail) {
        payload.logger.info(`[email] SendGrid not configured; not sending "${message.subject}" to ${String(message.to)}`)
        return
      }
      const to = Array.isArray(message.to) ? message.to.map(String) : String(message.to)
      const [response] = await sgMail.send({
        to,
        from: { email: fromEmail, name: fromName },
        replyTo: message.replyTo ? String(message.replyTo) : undefined,
        subject: String(message.subject ?? ''),
        html: message.html ? String(message.html) : undefined,
        text: message.text ? String(message.text) : undefined,
      } as any)
      return response
    },
  }
}
