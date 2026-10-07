import { notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/server'
import { getGeneralGlobal } from '@/lib/utils/payload/globals'

/** The shop is visible to everyone when set to public, otherwise only to admins. */
export async function canViewShop(): Promise<boolean> {
  const general = await getGeneralGlobal()
  if (general.shopVisibility === 'public') return true
  const user = await getCurrentUser()
  return Boolean(user?.isAdmin)
}

/** Call from a shop route's layout: responds with a 404 when the viewer may not see the shop. */
export async function requireShopAccess(): Promise<void> {
  if (!(await canViewShop())) notFound()
}
