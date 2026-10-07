import Navbar from '@/components/Hero/Navbar'
import { getHeaderGlobal, getGeneralGlobal } from '@/lib/utils/payload/globals'
import { getCurrentUser } from '@/lib/auth/server'

export default async function SiteNavbar() {
  const [header, general, user] = await Promise.all([
    getHeaderGlobal(),
    getGeneralGlobal(),
    getCurrentUser(),
  ])
  return (
    <Navbar
      logo={general.logoUrl}
      navItems={header.navItems}
      isAuthed={Boolean(user)}
      shopEnabled={general.shopVisibility === 'public' || Boolean(user?.isAdmin)}
    />
  )
}
