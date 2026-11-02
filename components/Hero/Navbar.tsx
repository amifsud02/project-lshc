'use client'
import { MobileNavbar } from "../Headers/MobileNavigation";
import { DesktopNavbar } from "../Headers/Header";
import type { NavButton, NavItem } from "../Headers/Header";
import { useSession } from "../Site/useSession";
import styles from './nav.module.css'

export default function Navbar({
  logo,
  navItems,
  buttons = [],
  shopPublic = false,
}: {
  logo?: string
  navItems?: NavItem[]
  buttons?: NavButton[]
  shopPublic?: boolean
} = {}) {
  const { authed, isAdmin } = useSession()
  // While the shop is hidden, admins still get its links so they can preview it.
  const shopEnabled = shopPublic || isAdmin

  return (
    <>
      <div className={styles.mobileNavbar}>
        <MobileNavbar logo={logo} navItems={navItems} buttons={buttons} isAuthed={authed} shopEnabled={shopEnabled} />
      </div>

      <div className={styles.desktopNavbar}>
        <DesktopNavbar logo={logo} navItems={navItems} buttons={buttons} isAuthed={authed} shopEnabled={shopEnabled} />
      </div>
    </>
  );
}
