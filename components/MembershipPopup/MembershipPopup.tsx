import { getGeneralGlobal } from '@/lib/utils/payload/globals'
import { getActiveProducts } from '@/lib/shop/products'
import { formatPrice } from '@/lib/shop/types'
import MembershipPopupDialog from './MembershipPopupDialog'

/**
 * The membership popup set up under Site Settings › Membership popup. The number of
 * memberships and the lowest price come from the active membership products, so the
 * popup always matches what the shop sells.
 */
export default async function MembershipPopup() {
  const { membershipPopup } = await getGeneralGlobal()
  if (!membershipPopup.enabled) return null

  const memberships = (await getActiveProducts()).filter((p) => p.type === 'membership')
  const lowest = memberships.length ? Math.min(...memberships.map((p) => p.price)) : undefined
  // "€25" reads better than "€25.00" in a headline price.
  const fromPrice = lowest === undefined ? undefined : formatPrice(lowest).replace(/[.,]00(?!\d)/, '')

  return (
    <MembershipPopupDialog
      {...membershipPopup}
      membershipCount={memberships.length}
      fromPrice={fromPrice}
    />
  )
}
