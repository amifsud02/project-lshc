"use client"

import styles from './Header.module.css'
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import Dropdown from './Dropdown/Dropdown';
import { usePathname } from 'next/navigation'
import { ChevronDown } from 'lucide-react';
import CartIcon from '@/components/Shop/CartIcon';
import AccountIcon from '@/components/Shop/AccountIcon';
import { SHOP_ENABLED, isShopHref } from '@/lib/shop/visibility';

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
        label: "Shop",
        href: "/shop",
    },
]

export function DesktopNavbar({
    logo,
    navItems,
    isAuthed = false,
}: {
    logo?: string
    navItems?: NavItem[]
    isAuthed?: boolean
} = {}) {

    const pathname = usePathname();
    const items = (navItems && navItems.length > 0 ? navItems : DEFAULT_NAV_ITEMS)
        .filter((item) => SHOP_ENABLED || !isShopHref(item.href))
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

                <div className={styles.rightCluster}>
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

                    {/* The account is used for nursery registrations too, so it stays visible when the shop is off. */}
                    <div className={styles.shopActions}>
                        <AccountIcon isAuthed={isAuthed} />
                        {SHOP_ENABLED ? <CartIcon /> : null}
                    </div>
                </div>
            </div>
        </header>
        </>
    )
}
