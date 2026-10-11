import { draftMode } from 'next/headers'
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

/**
 * The catalogue pages' version of `requireShopAccess`, which keeps them cacheable. It only
 * reads the session in preview mode (`/api/preview?path=/shop`), so visitors are served a
 * cached page, or a cached 404 while the shop is hidden, and admins preview it uncached.
 */
export async function requireShopCatalogueAccess(): Promise<void> {
  const general = await getGeneralGlobal()
  if (general.shopVisibility === 'public') return
  const { isEnabled: preview } = await draftMode()
  if (!preview) notFound()
  const user = await getCurrentUser()
  if (!user?.isAdmin) notFound()
}
