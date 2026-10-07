'use client'
import { MobileNavbar } from "../Headers/MobileNavigation";
import { DesktopNavbar } from "../Headers/Header";
import type { NavItem } from "../Headers/Header";
import { useSession } from "../Site/useSession";
import styles from './nav.module.css'

export default function Navbar({
  logo,
  navItems,
  shopPublic = false,
}: {
  logo?: string
  navItems?: NavItem[]
  shopPublic?: boolean
} = {}) {
  const { authed, isAdmin } = useSession()
  // While the shop is hidden, admins still get its links so they can preview it.
  const shopEnabled = shopPublic || isAdmin

  return (
    <>
      <div className={styles.mobileNavbar}>
        <MobileNavbar logo={logo} navItems={navItems} isAuthed={authed} shopEnabled={shopEnabled} />
      </div>

      <div className={styles.desktopNavbar}>
        <DesktopNavbar logo={logo} navItems={navItems} isAuthed={authed} shopEnabled={shopEnabled} />
      </div>
    </>
  );
}
