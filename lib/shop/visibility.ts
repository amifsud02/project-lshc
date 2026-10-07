// Client-safe helpers. Whether the shop is visible is controlled by Site Settings → Shop in the
// admin panel; the server-side check lives in `lib/shop/access.ts`.
const SHOP_HREFS = ['/shop', '/cart', '/checkout', '/account', '/login', '/register']

export const isShopHref = (href: string) =>
  SHOP_HREFS.some((p) => href === p || href.startsWith(`${p}/`))
