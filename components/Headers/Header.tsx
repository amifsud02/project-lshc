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
};

export type NavItem = {
    label: string;
    href: string;
    dropdown?: NavLink[];
};


const navItems: NavItem[] = [
    {
        label: "Home",
        href: "/",
    },
    {
        label: "Memberships",
        href: "https://memberships.lasallehandball.com",
    },
    // {
    //     label: "News",
    //     href: "/news",
    //     dropdown: [
    //         {
    //             label: "All The News",
    //             href: "/news/all-the-news"
    //         },
    //         // {
    //         //     label: "Photo Galleries",
    //         //     href: "/"
    //         // }
    //     ]
    // },
    // {
    //     label: "Teams",
    //     href: "/teams/men-first-team/all",
    //     dropdown: [
    //         {
    //             label: "Men's First Team",
    //             href: "/teams/men-first-team/all"
    //         },
    //         {
    //             label: "Women's First Team",
    //             href: "/teams/women-first-team/all"
    //         },
    //         {
    //             label: "U21 Men's Team",
    //             href: "/teams/u21-mens-team/all"
    //         },
    //         {
    //             label: "U21 Women's Team",
    //             href: "/teams/u21-womens-team/all"
    //         },
    //         {
    //             label: "Youth Teams",
    //             href: "/teams/youth-teams"
    //         }
    //     ]
    // },
    // {
    //     label: "Season",
    //     href: "/season/2024/schedule/men/all",
    //     dropdown: [
    //         {
    //             label: "Schedule",
    //             href: "/season/2024/schedule/men/all"
    //         },
    //         // {
    //         //     label: "Standings",
    //         //     href: "/"
    //         // }
    //     ]
    // },
    // {
    //     label: "Club",
    //     href: "/club/history",
    //     dropdown: [
    //         {
    //             label: "History",
    //             href: "/club/history"
    //         },
    //         // {
    //         //     label: "Management",
    //         //     href: "/club/management"
    //         // },
    //         {
    //             label: "Our Partners",
    //             href: "/club/sponsors"
    //         }
    //     ]
    // },
    // {
    //     label: "Contact Us",
    //     href: "/contact",
    // },
]

export function DesktopNavbar() {

    const pathname = usePathname();

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
                    <Link href={'/'}><Image src={'/lshc.png'} width={75} height={75} alt="LSHC Logo" className="w-[75px] h-[75px]" loading='eager'/></Link>
                </div>

                <ul className={styles.navItems}>
                    {navItems.map((item: NavItem) => (
                        <li
                            key={item.label} 
                            className={styles.navItem}
                            onMouseEnter={() => onMouseEnter(item.label)}
                            onMouseLeave={() => onMouseLeave(item.label)}
                        >
                            <span className={pathname === item.href ? `${styles.navLink} ${styles.active}` : styles.navLink}>
                                <>
                                    <Link className={styles.navItemLink} href={item.href}><p>{item.label}</p>{item.dropdown && (<ChevronDown className={styles.chevron}/>)}</Link> 
                                </>
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