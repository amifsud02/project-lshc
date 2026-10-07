import { requireShopAccess } from '@/lib/shop/access'

export default async function ShopGateLayout({ children }: { children: React.ReactNode }) {
  await requireShopAccess()
  return children
}
