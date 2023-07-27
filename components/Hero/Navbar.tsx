'use client'
import { MobileNavbar } from "../Headers/MobileNavigation";
import { DesktopNavbar } from "../Headers/Header";
import styles from './nav.module.css'

export default function Navbar() {
  return (
    <>
      {/* Show MobileNavbar for screens with width less than 1000px (mobile) */}
      <div className={styles.mobileNavbar}>
        <MobileNavbar />
      </div>

      {/* Show DesktopNavbar for screens with width 1000px and above (desktop) */}
      <div className={styles.desktopNavbar}>
        <DesktopNavbar />
      </div>
    </>
  );
}
