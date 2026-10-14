import crypto from 'node:crypto'
import type { CustomFieldDef } from '@/lib/shop/types'

/**
 * MEMBRS sells and manages the club's memberships: our site collects each member's details,
 * MEMBRS takes the payment (Stripe) and gives every member an account and digital card.
 * See the MEMBRS "Selling memberships from your own website" guide.
 */

export type MembrsVariant = { id: number; name: string; sku: string | null; price: string; in_stock: boolean }
export type MembrsPlan = {
  id: number
  name: string
  price: string
  currency?: string
  members_covered: number
  products: Array<{ id: number; name: string; included: boolean; variants: MembrsVariant[] }>
}
export type MembrsCheckout = {
  id: string
  reference: string | null
  status: 'pending' | 'completed' | 'expired' | 'failed' | 'refunded'
  amount: string
  currency: string
  members: Array<{
    transaction_id: number
    name: string
    email: string
    items: Array<{ product: string | null; variant: string | null; sku: string | null }>
    membership: { code: string; status: string; expires_at: string | null } | null
  }>
  checkout_url?: string
}

export class MembrsError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: Record<string, string[]>,
  ) {
    super(message)
  }
}

async function membrs<T>(path: string, init: RequestInit = {}): Promise<T> {
  const baseUrl = process.env.MEMBRS_API_URL
  const apiKey = process.env.MEMBRS_API_KEY
  if (!baseUrl || !apiKey) throw new Error('MEMBRS_API_URL and MEMBRS_API_KEY must be set')

  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/v1${path}`, {
    cache: init.next ? undefined : 'no-store',
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...init.headers,
    },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new MembrsError(body.message ?? `MEMBRS request failed (${res.status})`, res.status, body.errors)
  return body.data as T
}

/** Pass `revalidate` (seconds) to allow a cached copy, e.g. when rendering the product page. */
export const getMembrsPlans = (revalidate?: number) =>
  membrs<MembrsPlan[]>('/plans', revalidate ? { next: { revalidate } } : {})

export const getMembrsPlan = async (planId: number, revalidate?: number): Promise<MembrsPlan | undefined> =>
  (await getMembrsPlans(revalidate)).find((plan) => plan.id === planId)

/** Products that come free with the plan; each member has to pick a variant (e.g. their size). */
export const includedProducts = (plan: MembrsPlan) => plan.products.filter((p) => p.included && p.variants.length > 0)

/** The form field where a member picks their variant of an included product; the answer is the variant name. */
export const includedProductFieldName = (productId: number) => `membrsProduct${productId}`

export const includedProductField = (product: MembrsPlan['products'][number]): CustomFieldDef => ({
  name: includedProductFieldName(product.id),
  label: product.name,
  kind: 'select',
  required: true,
  options: product.variants.map((v) => ({ value: v.name, label: v.in_stock ? v.name : `${v.name} (sold out)` })),
})

export const createMembrsCheckout = (input: {
  plan_id: number
  members: Array<{ name: string; email: string; products: Array<{ product_id: number; variant_id: number }> }>
  success_url: string
  cancel_url: string
  reference: string
}) => membrs<MembrsCheckout>('/checkouts', { method: 'POST', body: JSON.stringify(input) })

export type MembrsWebhookEvent = {
  id: string
  type: 'membership.purchased' | 'membership.refunded' | 'checkout.expired'
  created: number
  data: MembrsCheckout
}

/** Checks the `Membrs-Signature: t=…,v1=…` header (HMAC-SHA256 of "t.body") and rejects stale requests. */
export function verifyMembrsWebhook(rawBody: string, header: string | null, toleranceSeconds = 300): MembrsWebhookEvent | null {
  const secret = process.env.MEMBRS_WEBHOOK_SECRET
  if (!secret || !header) return null

  const t = header.match(/(?:^|,)t=(\d+)/)?.[1]
  const v1 = header.match(/(?:^|,)v1=([a-f0-9]{64})/)?.[1]
  if (!t || !v1 || Math.abs(Date.now() / 1000 - Number(t)) > toleranceSeconds) return null

  const expected = crypto.createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex')
  if (!crypto.timingSafeEqual(Buffer.from(v1), Buffer.from(expected))) return null

  return JSON.parse(rawBody) as MembrsWebhookEvent
}
