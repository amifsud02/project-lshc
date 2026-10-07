'use client'
import { MobileNavbar } from "../Headers/MobileNavigation";
import { DesktopNavbar } from "../Headers/Header";
import type { NavItem } from "../Headers/Header";
import styles from './nav.module.css'

export default function Navbar({
  logo,
  navItems,
  isAuthed = false,
  shopEnabled = false,
}: {
  logo?: string
  navItems?: NavItem[]
  isAuthed?: boolean
  shopEnabled?: boolean
} = {}) {
  return (
    <>
      <div className={styles.mobileNavbar}>
        <MobileNavbar logo={logo} navItems={navItems} isAuthed={isAuthed} shopEnabled={shopEnabled} />
      </div>

      <div className={styles.desktopNavbar}>
        <DesktopNavbar logo={logo} navItems={navItems} isAuthed={isAuthed} shopEnabled={shopEnabled} />
      </div>
    </>
  );
}
