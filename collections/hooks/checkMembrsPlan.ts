import { ValidationError, type CollectionBeforeChangeHook } from 'payload'
import { getMembrsPlan } from '@/lib/membrs/client'
import { checkMembrsCompatibility } from '@/lib/membrs/compatibility'
import { buildUnitTemplates } from '@/lib/shop/units'

/**
 * An active membership must match the MEMBRS plan it is sold as (members covered, price, sizes),
 * otherwise checkout fails or charges something else. If MEMBRS can't be reached the save goes
 * through; `pnpm check-membrs` reports on every membership.
 */
export const checkMembrsPlan: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  const doc = { ...originalDoc, ...data }
  if (doc.type !== 'membership' || !doc.active) return data

  // Included products arrive as IDs; their questions decide how variants are picked.
  const populate = async (product: unknown) =>
    product && typeof product !== 'object'
      ? await req.payload.findByID({ collection: 'products', id: product as string, depth: 0, req }).catch(() => null)
      : product
  const bundleItems = await Promise.all(
    (Array.isArray(doc.bundleItems) ? doc.bundleItems : []).map(async (item: any) => ({
      ...item,
      product: await populate(item?.product),
      choices: Array.isArray(item?.choices) ? await Promise.all(item.choices.map(populate)) : item?.choices,
    })),
  )

  let plan
  const planId = Number(doc.membership?.membrsPlanId) || undefined
  if (planId) {
    try {
      plan = await getMembrsPlan(planId)
    } catch (err) {
      req.payload.logger.warn({ err, planId }, 'Could not reach MEMBRS to check the membership plan')
      return data
    }
  }

  const { errors } = checkMembrsCompatibility(
    {
      price: Number(doc.price) || 0,
      membership: { membersCovered: Math.max(1, Number(doc.membership?.membersCovered) || 1), membrsPlanId: planId },
      unitTemplates: buildUnitTemplates({ ...doc, bundleItems }),
    },
    plan,
  )
  if (errors.length) {
    throw new ValidationError({
      collection: 'products',
      errors: errors.map((message) => ({ path: 'membership.membrsPlanId', message })),
      req,
    })
  }
  return data
}
