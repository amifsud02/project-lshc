"use client"

import styles from './Header.module.css'
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import Dropdown from './Dropdown/Dropdown';
import { usePathname } from 'next/navigation'
import { ChevronDown } from 'lucide-react';

export type NavLink = {
    label: string;
    href: string;
    newTab?: boolean;
};

export type NavItem = NavLink & {
    dropdown?: NavLink[];
};

const linkTargetProps = (newTab?: boolean) =>
    newTab ? { target: '_blank' as const, rel: 'noopener noreferrer' } : {}

const DEFAULT_NAV_ITEMS: NavItem[] = [
    {
        label: "Home",
        href: "/",
    },
    {
        label: "Memberships",
        href: "https://memberships.lasallehandball.com",
    },
]

export function DesktopNavbar({
    logo,
    navItems,
}: {
    logo?: string
    navItems?: NavItem[]
} = {}) {

    const pathname = usePathname();
    const items = navItems && navItems.length > 0 ? navItems : DEFAULT_NAV_ITEMS
    const logoSrc = logo ?? '/lshc.png'

    const [dropdownState, setDropdownState] = useState<{ [key: string]: boolean }>({});


    const onMouseEnter = (label: string) => {
        if (window.innerWidth >= 960) {
            setDropdownState((prevState) => ({ ...prevState, [label]: true }));
        }
    };

    const onMouseLeave = (label: string) => {
        if (window.innerWidth >= 960) {
            setDropdownState((prevState) => ({ ...prevState, [label]: false }));
        }
    };

    return (
        <>
        <header className={styles.mainNavBG}>
            <div className={`${styles.mainNav}`}>
                <div>
                    <Link href={'/'}><Image src={logoSrc} width={75} height={75} alt="LSHC Logo" className="w-[75px] h-[75px]" loading='eager'/></Link>
                </div>

                <ul className={styles.navItems}>
                    {items.map((item: NavItem) => (
                        <li
                            key={item.label}
                            className={styles.navItem}
                            onMouseEnter={() => onMouseEnter(item.label)}
                            onMouseLeave={() => onMouseLeave(item.label)}
                        >
                            <span className={pathname === item.href ? `${styles.navLink} ${styles.active}` : styles.navLink}>
                                <Link
                                    className={styles.navItemLink}
                                    href={item.href}
                                    {...linkTargetProps(item.newTab)}
                                >
                                    <p>{item.label}</p>
                                    {item.dropdown && (<ChevronDown className={styles.chevron}/>)}
                                </Link>
                            </span>

                            {dropdownState[item.label] && (item.dropdown && (
                               <Dropdown dropdown={item.dropdown}></Dropdown>
                            ))}
                        </li>
                    ))}
                </ul>
            </div>
        </header>
        </>
    )
}
