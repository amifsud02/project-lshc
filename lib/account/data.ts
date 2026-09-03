import { getPayload, type Payload, type Where } from 'payload'
import config from '@payload-config'
import type { NurseryRegistration, Order } from '@/payload-types'
import type { CurrentUser } from '@/lib/auth/server'

export const orderStatusLabels: Record<Order['status'], string> = {
  cancelled: 'Cancelled',
  fulfilled: 'Completed',
  paid: 'Paid',
  pending: 'Pending payment',
  refunded: 'Refunded',
}

export const nurseryStatusLabels: Record<NurseryRegistration['status'], string> = {
  'awaiting-transfer': 'Awaiting bank transfer',
  cancelled: 'Cancelled',
  paid: 'Confirmed',
  pending: 'Pending payment',
  refunded: 'Refunded',
}

/** Badge tone per status, shared by orders and nursery registrations. */
export const statusTone = (status: string): 'ok' | 'warn' | 'bad' | 'muted' => {
  if (status === 'paid' || status === 'fulfilled') return 'ok'
  if (status === 'pending' || status === 'awaiting-transfer') return 'warn'
  if (status === 'cancelled' || status === 'refunded') return 'bad'
  return 'muted'
}

export const formatDate = (value: string | Date): string =>
  new Date(value).toLocaleDateString('en-MT', { day: 'numeric', month: 'long', year: 'numeric' })

const ownedOrders = (user: CurrentUser): Where => ({
  or: [{ user: { equals: user.id } }, { customerEmail: { equals: user.email } }],
})

const ownedRegistrations = (user: CurrentUser): Where => ({
  or: [{ user: { equals: user.id } }, { 'parent.email': { equals: user.email } }],
})

export async function getUserOrders(user: CurrentUser, limit = 50): Promise<Order[]> {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'orders',
    limit,
    overrideAccess: true,
    sort: '-createdAt',
    where: ownedOrders(user),
  })
  return docs
}

export async function getUserOrder(user: CurrentUser, orderNumber: string): Promise<Order | null> {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'orders',
    limit: 1,
    overrideAccess: true,
    where: { and: [{ orderNumber: { equals: orderNumber } }, ownedOrders(user)] },
  })
  return docs[0] ?? null
}

export async function getUserNurseryRegistrations(
  user: CurrentUser,
  limit = 50,
): Promise<NurseryRegistration[]> {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'nursery-registrations',
    depth: 1,
    limit,
    overrideAccess: true,
    sort: '-createdAt',
    where: ownedRegistrations(user),
  })
  return docs
}

export async function countUserRecords(user: CurrentUser): Promise<{ nursery: number; orders: number }> {
  const payload: Payload = await getPayload({ config })
  const [orders, nursery] = await Promise.all([
    payload.count({ collection: 'orders', overrideAccess: true, where: ownedOrders(user) }),
    payload.count({
      collection: 'nursery-registrations',
      overrideAccess: true,
      where: ownedRegistrations(user),
    }),
  ])
  return { nursery: nursery.totalDocs, orders: orders.totalDocs }
}
