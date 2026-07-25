// Flip to true to show the shop/account UI again (nav links, cart icon, sign in).
export const SHOP_ENABLED = false

const SHOP_HREFS = ['/shop', '/cart', '/checkout', '/account', '/login', '/register']

export const isShopHref = (href: string) =>
  SHOP_HREFS.some((p) => href === p || href.startsWith(`${p}/`))
