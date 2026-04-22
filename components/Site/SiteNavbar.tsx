import Navbar from '@/components/Hero/Navbar'
import { getHeaderGlobal, getGeneralGlobal } from '@/lib/utils/payload/globals'

export default async function SiteNavbar() {
  const [header, general] = await Promise.all([
    getHeaderGlobal(),
    getGeneralGlobal(),
  ])
  return <Navbar logo={general.logoUrl} navItems={header.navItems} />
}
