import { requireShopAccess } from '@/lib/shop/access'

// Per-visitor pages: keep them out of search results.
export const metadata = { robots: { index: false, follow: false } }

export default async function ShopGateLayout({ children }: { children: React.ReactNode }) {
  await requireShopAccess()
  return children
}
