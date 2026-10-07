'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './Mobile.module.css';
import { Menu, X, ChevronDown } from 'lucide-react';
import type { NavItem } from './Header';
import CartIcon from '@/components/Shop/CartIcon';
import AccountIcon from '@/components/Shop/AccountIcon';
import { isShopHref } from '@/lib/shop/visibility';

import { Accordion, AccordionItem as Item } from '@szhsin/react-accordion';
import { usePathname } from 'next/navigation';

const DEFAULT_NAV_ITEMS: NavItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Shop', href: '/shop' },
]

interface AccordionItemProps {
    header: string;
    url: string;
    style?: React.CSSProperties;
    children: React.ReactNode;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ header, url, ...rest }) => {
    const pathName = usePathname();

    const regex = new RegExp(url);
    const isUrl = regex.test(pathName);

    return (
        <Item
            {...rest}

            header={
                <>
                    <span className={`${isUrl && styles.active}`}>{header}</span>
                    <ChevronDown size={35} className={`${isUrl && styles.active} ${styles.chevron} `} />
                </>
            }

            className={styles.item}
            buttonProps={{
                className: ({ isEnter }) =>
                    `${styles.itemBtn} ${isEnter && styles.itemBtnExpanded}`
            }}
            contentProps={{ className: ({ isEnter }) => `${styles.itemContent} ${isEnter && styles.listExpanded}` }}
            panelProps={{ className: styles.itemPanel }}
        />
    )
};

export const MobileNavbar = ({
    logo,
    navItems,
    isAuthed = false,
    shopEnabled = false,
}: {
    logo?: string
    navItems?: NavItem[]
    isAuthed?: boolean
    shopEnabled?: boolean
} = {}) => {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const items = (navItems && navItems.length > 0 ? navItems : DEFAULT_NAV_ITEMS)
        .filter((item) => shopEnabled || !isShopHref(item.href))
    const logoSrc = logo ?? '/lshc.png'

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- closes menu on route change to prevent stale UI
        setIsOpen(false);
    }, [pathname])

    useEffect(() => {
        if (isOpen) {
            document.documentElement.style.overflowY = 'hidden';
        }
        else {
            document.documentElement.style.removeProperty('overflow-y');
        }
    }, [isOpen])

    return (
        <>
            <header className={`${styles.nav__wrapper} ${isOpen && styles.nav__bg}`}>
                <div className={styles.navbar}>

                    <div className={styles.nav__top}>
                        <div className={styles.nav__brand}>
                            <Link href={'/'} onClick={() => setIsOpen(false)}><Image src={logoSrc} alt="LSHC Logo" width={75} height={75} /></Link>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: '#fff' }}>
                            <AccountIcon isAuthed={isAuthed} />
                            {shopEnabled ? <CartIcon /> : null}
                            {
                                isOpen
                                    ? <X color='white' size={40} onClick={() => setIsOpen(!isOpen)} />
                                    : <Menu color='white' size={40} onClick={() => setIsOpen(!isOpen)} />
                            }
                        </div>
                    </div>

                    <nav className={`${styles.nav__menu} ${styles.accordion} ${isOpen && styles.nav__open}`}>
                        {
                            isOpen && (
                                <Accordion transition transitionTimeout={250}>
                                    {items.map((item) => (
                                        <Link
                                            key={item.label}
                                            className={pathname === item.href ? `${styles.navItemLink} ${styles.active} w-full` : `${styles.navItemLink} w-full`}
                                            href={item.href}
                                            onClick={() => setIsOpen(false)}
                                            {...(item.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                                        >
                                            <p>{item.label}</p>
                                        </Link>
                                    ))}
                                    <Link
                                        className={`${styles.navItemLink} w-full`}
                                        href={isAuthed ? '/account' : '/login'}
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <p>{isAuthed ? 'My account' : 'Sign in'}</p>
                                    </Link>
                                </Accordion>
                            )
                        }
                    </nav>
                </div>
            </header>
        </>
    )
}
