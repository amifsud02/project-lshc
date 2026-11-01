'use server'

import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { hasRole } from '@/lib/auth/roles'
import { SAMPLE_ORDER, SHOP_EMAILS, renderShopEmail, sendShopEmail, type ShopEmailKind } from './shopEmails'

/** The email test page is for the people who run the shop. */
async function staffOnly() {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!user || !hasRole(user as any, 'admin', 'shop-manager')) throw new Error('Only shop staff can use the email test page.')
  return { payload, user }
}

const check = (kind: string): ShopEmailKind => {
  if (!(kind in SHOP_EMAILS)) throw new Error('Unknown email template.')
  return kind as ShopEmailKind
}

async function orderFor(payload: Awaited<ReturnType<typeof staffOnly>>['payload'], orderId: string) {
  if (orderId === 'sample') return SAMPLE_ORDER
  return payload.findByID({ collection: 'orders', id: orderId, depth: 0 })
}

export async function previewShopEmail(kind: string, orderId: string) {
  const { payload } = await staffOnly()
  const email = await renderShopEmail(payload, check(kind), await orderFor(payload, orderId))
  return { subject: email.subject, to: email.to, replyTo: email.replyTo, html: email.html, text: email.text }
}

export async function sendTestShopEmail(kind: string, orderId: string, to: string) {
  const { payload } = await staffOnly()
  const address = to.trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) return { ok: false, message: 'Enter a valid email address to send the test to.' }
  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
    return { ok: false, message: 'Email sending is not set up on this server (SENDGRID_API_KEY / SENDGRID_FROM_EMAIL), so nothing was sent.' }
  }
  try {
    await sendShopEmail(payload, check(kind), await orderFor(payload, orderId), { to: address, test: true })
    return { ok: true, message: `Test sent to ${address}.` }
  } catch (err) {
    payload.logger.error({ err, msg: '[emails] test send failed' })
    return { ok: false, message: 'SendGrid rejected the email. Check the server logs.' }
  }
}
