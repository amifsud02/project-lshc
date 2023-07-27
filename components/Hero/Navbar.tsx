'use client'

import { useEffect, useState } from "react";
import { MobileNavbar } from "../Headers/MobileNavigation";
import { DesktopNavbar } from "../Headers/Header";

export default function Navbar() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
      const handleResize = () => {
        setIsMobile(window.innerWidth < 1000); // Set the breakpoint according to your design
      };
  
      // Add event listener to detect window resize
      window.addEventListener('resize', handleResize);
  
      // Call the handleResize function initially to set the initial state correctly
      handleResize();
  
      // Clean up the event listener when the component unmounts
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }, []);

    return (
        <>
            {isMobile ? <MobileNavbar /> : <DesktopNavbar />}
        </>
    )
}