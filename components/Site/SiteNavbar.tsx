import Navbar from '@/components/Hero/Navbar'
import { getHeaderGlobal, getGeneralGlobal } from '@/lib/utils/payload/globals'

// Deliberately reads no cookies or headers: that keeps every page cacheable. The logged-in
// state (and the admin-only shop preview) is filled in on the client by `useSession`.
export default async function SiteNavbar() {
  const [header, general] = await Promise.all([getHeaderGlobal(), getGeneralGlobal()])
  return (
    <Navbar
      logo={general.logoUrl}
      navItems={header.navItems}
      shopPublic={general.shopVisibility === 'public'}
    />
  )
}
