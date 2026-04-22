'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './Mobile.module.css';
import { Menu, X, ChevronDown } from 'lucide-react';
import type { NavItem } from './Header';

import { Accordion, AccordionItem as Item } from '@szhsin/react-accordion';
import { usePathname } from 'next/navigation';

const DEFAULT_NAV_ITEMS: NavItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Memberships', href: 'https://memberships.lasallehandball.com' },
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
}: {
    logo?: string
    navItems?: NavItem[]
} = {}) => {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const items = navItems && navItems.length > 0 ? navItems : DEFAULT_NAV_ITEMS
    const logoSrc = logo ?? '/lshc.png'

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
                            <Link href={'/'}><img src={logoSrc} alt="LSHC Logo" className="w-[75px] h-[75px]" /></Link>
                        </div>
                        {
                            isOpen
                                ? <X color='white' size={40} onClick={() => setIsOpen(!isOpen)} />
                                : <Menu color='white' size={40} onClick={() => setIsOpen(!isOpen)} />
                        }
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
                                            {...(item.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                                        >
                                            <p>{item.label}</p>
                                        </Link>
                                    ))}
                                </Accordion>
                            )
                        }
                    </nav>
                </div>
            </header>
        </>
    )
}
