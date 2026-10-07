import type { PayloadRequest } from 'payload'

import type { Order } from '@/payload-types'

const idOf = (value: unknown): string | undefined => {
  if (value == null) return undefined
  if (typeof value === 'object') return idOf((value as { id?: unknown }).id)
  return String(value)
}

/**
 * Turns every member line of a paid order into a membership record. Lines are
 * recognised by `membershipSeason`, which checkout sets on each member unit.
 * Safe against the hook firing twice: an order that already has members is skipped.
 */
export const createMembershipsForOrder = async (order: Order, req: PayloadRequest) => {
  const memberLines = (order.items ?? []).filter((item) => item.membershipSeason)
  if (!memberLines.length) return

  const { totalDocs } = await req.payload.count({
    collection: 'memberships',
    where: { order: { equals: order.id } },
    req,
  })
  if (totalDocs > 0) return

  for (const line of memberLines) {
    const values = { ...((line.customFieldValues ?? {}) as Record<string, string>) }
    const { firstName = '', lastName = '', mobile = '', email = '', ...details } = values

    await req.payload.create({
      collection: 'memberships',
      data: {
        firstName,
        lastName,
        mobile,
        email: email || undefined,
        season: line.membershipSeason!,
        status: 'active',
        product: idOf(line.product),
        order: order.id,
        details: Object.keys(details).length ? details : undefined,
      },
      req,
    })
  }
}

export const cancelMembershipsForOrder = async (order: Order, req: PayloadRequest) => {
  await req.payload.update({
    collection: 'memberships',
    where: { order: { equals: order.id } },
    data: { status: 'cancelled' },
    req,
  })
}
