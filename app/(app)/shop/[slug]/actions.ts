'use server'

import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { createMembrsCheckout, getMembrsPlan, MembrsError } from '@/lib/membrs/client'
import { canViewShop } from '@/lib/shop/access'
import { getProductById } from '@/lib/shop/products'
import type { CartUnit } from '@/lib/shop/types'
import { validateUnit } from '@/lib/shop/validation'

type Input = {
  productId: string
  units: Pick<CartUnit, 'productId' | 'values'>[]
}

type Result = { ok: true; url: string } | { ok: false; error: string }

const sameText = (a?: string | null, b?: string | null) =>
  Boolean(a && b && a.trim().toLowerCase() === b.trim().toLowerCase())

/**
 * Memberships are bought on their own, straight from the product page: we record the order
 * here (so it shows in the club's orders and member register once paid) and send the buyer to
 * MEMBRS to pay. MEMBRS's webhook marks the order paid (see /api/membrs/webhook).
 */
export async function buyMembership({ productId, units }: Input): Promise<Result> {
  if (!(await canViewShop())) return { ok: false, error: 'The shop is currently unavailable.' }

  const product = await getProductById(productId)
  if (!product || !product.active || product.type !== 'membership') {
    return { ok: false, error: 'This membership is no longer available.' }
  }
  const planId = product.membership?.membrsPlanId
  if (!planId) return { ok: false, error: 'This membership is not available online yet.' }

  // Units come from the browser, so check them against the product as it is now.
  const templates = product.unitTemplates
  if (units.length !== templates.length || units.some((u, i) => u.productId !== templates[i].productId)) {
    return { ok: false, error: 'This membership has changed. Please reload the page and try again.' }
  }
  for (const [i, template] of templates.entries()) {
    const error = validateUnit({ customFields: template.customFields, values: units[i].values })
    if (error) return { ok: false, error: `${template.productTitle}: ${error}` }
  }

  let plan
  try {
    plan = await getMembrsPlan(planId)
  } catch (err) {
    console.error('[membrs] failed to load plan', err)
    return { ok: false, error: 'Memberships are temporarily unavailable. Please try again shortly.' }
  }
  if (!plan || plan.members_covered !== product.membership!.membersCovered) {
    console.error('[membrs] plan missing or members covered mismatch', { planId, product: product.id })
    return { ok: false, error: 'This membership is not available online yet.' }
  }

  // Member units come first, then included products (e.g. one T-shirt per member).
  const memberCount = plan.members_covered
  const memberUnits = units.slice(0, memberCount)
  const extraUnits = units.slice(memberCount)
  const includedProducts = plan.products.filter((p) => p.included && p.variants.length > 0)

  const members = []
  for (const [i, unit] of memberUnits.entries()) {
    const { firstName = '', lastName = '', email = '' } = unit.values
    const answers = extraUnits.filter((_, j) => j % memberCount === i).flatMap((u) => Object.values(u.values))

    const products = []
    for (const membrsProduct of includedProducts) {
      // Match the size picked on our site (e.g. "M") to the MEMBRS variant. A product with a
      // single variant (e.g. a merchandise pack) has nothing to choose, so it needs no answer.
      const variant =
        membrsProduct.variants.find((v) => answers.some((a) => sameText(a, v.name) || sameText(a, v.sku))) ??
        (membrsProduct.variants.length === 1 ? membrsProduct.variants[0] : undefined)
      if (!variant) {
        return { ok: false, error: `Choose a ${membrsProduct.name} option for ${firstName || `member ${i + 1}`}.` }
      }
      if (!variant.in_stock) {
        return { ok: false, error: `${membrsProduct.name} (${variant.name}) is out of stock.` }
      }
      products.push({ product_id: membrsProduct.id, variant_id: variant.id })
    }
    members.push({ name: `${firstName} ${lastName}`.trim(), email, products })
  }

  const payload = await getPayload({ config })
  let currentUserId: string | undefined
  try {
    const { user } = await payload.auth({ headers: await headers() })
    if (user) currentUserId = String(user.id)
  } catch {
    currentUserId = undefined
  }

  const buyer = memberUnits[0].values
  const order = await payload.create({
    collection: 'orders',
    data: {
      status: 'pending',
      paymentProvider: 'membrs',
      customerEmail: buyer.email,
      customerName: `${buyer.firstName ?? ''} ${buyer.lastName ?? ''}`.trim() || undefined,
      customerPhone: buyer.mobile || undefined,
      user: currentUserId,
      items: templates.map((template, i) => {
        const isMember = i < memberCount
        return {
          productTitle: template.productTitle,
          product: template.productId,
          bundleParentLineId: i === 0 ? undefined : 'membership',
          membershipSeason: isMember ? product.membership?.season : undefined,
          quantity: 1,
          unitPrice: i === 0 ? product.price : 0,
          customFieldValues: units[i].values ?? {},
        }
      }),
      subtotal: product.price,
      total: product.price,
      currency: 'eur',
    } as any,
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'

  try {
    const checkout = await createMembrsCheckout({
      plan_id: plan.id,
      members,
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/shop/${product.slug}`,
      reference: String(order.orderNumber),
    })

    await payload.update({
      collection: 'orders',
      id: order.id,
      data: { stripeCheckoutSessionId: checkout.id } as any,
    })

    return { ok: true, url: checkout.checkout_url! }
  } catch (err) {
    await payload.update({ collection: 'orders', id: order.id, data: { status: 'cancelled' } as any })
    if (err instanceof MembrsError && err.status === 422) {
      const first = Object.values(err.errors ?? {})[0]?.[0]
      return { ok: false, error: first ?? err.message }
    }
    console.error('[membrs] checkout failed', err)
    return { ok: false, error: 'We could not start the payment. Please try again.' }
  }
}
