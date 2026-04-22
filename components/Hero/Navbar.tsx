'use client'
import { MobileNavbar } from "../Headers/MobileNavigation";
import { DesktopNavbar } from "../Headers/Header";
import type { NavItem } from "../Headers/Header";
import styles from './nav.module.css'

export default function Navbar({
  logo,
  navItems,
}: {
  logo?: string
  navItems?: NavItem[]
} = {}) {
  return (
    <>
      <div className={styles.mobileNavbar}>
        <MobileNavbar logo={logo} navItems={navItems} />
      </div>

      <div className={styles.desktopNavbar}>
        <DesktopNavbar logo={logo} navItems={navItems} />
      </div>
    </>
  );
}
