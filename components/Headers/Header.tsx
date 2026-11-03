"use client"

import styles from './Header.module.css'
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { usePathname } from 'next/navigation'
import { ChevronDown } from 'lucide-react';
import CartIcon from '@/components/Shop/CartIcon';
import AccountIcon from '@/components/Shop/AccountIcon';
import { ACCOUNTS_ENABLED } from '@/lib/features';
import { isShopHref } from '@/lib/shop/visibility';
import type { NavButton, NavItem, NavLink } from '@/lib/utils/normalize/globals';
import MegaPanel from './MegaPanel';

export type { NavButton, NavItem, NavLink };

/** The buttons beside the cart: only the first shows on desktop, the mobile menu shows all of them full width. */
export function HeaderButtons({ buttons, className, onClick }: { buttons: NavButton[]; className?: string; onClick?: () => void }) {
    if (!buttons.length) return null
    return (
        <div className={`${styles.buttons} ${className ?? ''}`}>
            {buttons.map((b) => (
                <Link
                    key={b.href + b.label}
                    href={b.href}
                    className={`${styles.button} ${b.appearance === 'outline' ? styles.buttonOutline : ''}`}
                    onClick={onClick}
                    {...linkTargetProps(b.newTab)}
                >
                    {b.label}
                </Link>
            ))}
        </div>
    )
}

export const linkTargetProps = (newTab?: boolean) =>
    newTab ? { target: '_blank' as const, rel: 'noopener noreferrer' } : {}

/** Every page a menu item leads to, so the item shows as current on any of them. */
export const itemHrefs = (item: NavItem): string[] => [
    item.href,
    ...(item.mega?.columns.flatMap((c) => c.links.map((l) => l.href)) ?? []),
]

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
    buttons = [],
    isAuthed = false,
    shopEnabled = false,
}: {
    logo?: string
    navItems?: NavItem[]
    buttons?: NavButton[]
    isAuthed?: boolean
    shopEnabled?: boolean
} = {}) {

    const pathname = usePathname();
    const items = (navItems && navItems.length > 0 ? navItems : DEFAULT_NAV_ITEMS)
        .filter((item) => shopEnabled || !isShopHref(item.href))
    const logoSrc = logo ?? '/lshc.png'

    // The open panel is tied to the page it was opened on, so following a link closes it.
    const [open, setOpen] = useState<{ label: string; path: string; focus?: boolean } | null>(null)
    const openItem = open && open.path === pathname ? items.find((i) => i.label === open.label && i.mega) : undefined
    // `focus` moves the keyboard into the panel when it was opened with its button.
    const show = (item: NavItem, focus = false) => setOpen(item.mega ? { label: item.label, path: pathname, focus } : null)
    const close = () => setOpen(null)

    // A page can sit in two sections (the academy is under Teams and Play): only the first shows as current.
    const currentLabel = items.find((i) => itemHrefs(i).includes(pathname))?.label

    const renderItems = (list: NavItem[]) => (
        <ul className={styles.navItems}>
            {list.map((item) => {
                const isOpen = openItem?.label === item.label
                const current = item.label === currentLabel
                return (
                    <li key={item.label} className={styles.navItem} onMouseEnter={() => show(item)}>
                        <Link
                            className={`${styles.navLink} ${current ? styles.active : ''} ${isOpen ? styles.open : ''}`}
                            href={item.href}
                            aria-current={pathname === item.href ? 'page' : undefined}
                            onFocus={() => show(item)}
                            {...linkTargetProps(item.newTab)}
                        >
                            {item.label}
                        </Link>
                        {item.mega ? (
                            <button
                                type="button"
                                className={`${styles.chevronBtn} ${isOpen ? styles.chevronOpen : ''}`}
                                aria-expanded={isOpen}
                                aria-controls="mega-panel"
                                aria-label={`${isOpen ? 'Close' : 'Open'} ${item.label} menu`}
                                onClick={() => (isOpen ? close() : show(item, true))}
                            >
                                <ChevronDown size={16} aria-hidden />
                            </button>
                        ) : null}
                    </li>
                )
            })}
        </ul>
    )

    return (
        <header
            className={`${styles.mainNavBG} ${openItem ? styles.solid : ''}`}
            onMouseLeave={close}
            onKeyDown={(e) => { if (e.key === 'Escape') close() }}
        >
            <div className={styles.mainNav}>
                <Link href={'/'} className={styles.logo} onMouseEnter={close} aria-label="La Salle Handball Club home">
                    <Image src={logoSrc} width={52} height={52} alt="" className="w-[52px] h-[52px]" loading='eager' unoptimized/>
                </Link>

                <nav aria-label="Main" className={styles.menu}>
                    {renderItems(items)}
                </nav>

                {/* The account is used for nursery registrations too, so it stays visible when the shop is off. */}
                <div className={styles.actions} onMouseEnter={close}>
                    <div className={styles.shopActions}>
                        {ACCOUNTS_ENABLED ? <AccountIcon isAuthed={isAuthed} /> : null}
                        {shopEnabled ? <CartIcon /> : null}
                    </div>
                    <HeaderButtons buttons={buttons} />
                </div>
            </div>

            {openItem?.mega ? <MegaPanel key={openItem.label} mega={openItem.mega} pathname={pathname} focusFirst={open?.focus} /> : null}
        </header>
    )
}
