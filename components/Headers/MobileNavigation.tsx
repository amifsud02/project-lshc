'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from "next/image";
import styles from './Mobile.module.css';
import { Menu, X, ChevronDown } from 'lucide-react';

import { Accordion, AccordionItem as Item } from '@szhsin/react-accordion';
import { usePathname } from 'next/navigation';

interface AccordionItemProps {
    header: string;
    url: string;
    style?: React.CSSProperties;
    children: React.ReactNode;
  }

const AccordionItem: React.FC<AccordionItemProps> = ({header, url, ...rest}) => {
    const pathName = usePathname();   
    
    const regex = new RegExp(url);
    const isUrl = regex.test(pathName);

    console.log(pathName, regex,  isUrl);
    
    return (
        <Item
            {...rest}

            header={
                <>
                    <span className={`${isUrl && styles.active}`}>{header}</span>
                    <ChevronDown size={35} className={`${isUrl && styles.active} ${styles.chevron} `}/>
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

export const MobileNavbar = () => {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if(isOpen) {
            document.body.style.overflowY = 'hidden';
        }

        else {
            document.body.style.overflowY = 'scroll';
        }
    }, [isOpen])
    
    return (
        <>
            <header className={`${styles.nav__wrapper} ${isOpen && styles.nav__bg}`}>
                <div className={styles.navbar}>

                    <div className={styles.nav__top}>
                        <div className={styles.nav__brand}>
                            <Image src={'/lshc.png'} width={75} height={75} alt="LSHC Logo" className="w-[75px] h-[75px]" />
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
                                    <Link className={pathname === '/' ? `${styles.navItemLink} ${styles.active}` : styles.navItemLink} href="/"><p>Home</p></Link>

                                    <AccordionItem header="Teams" url='^\/teams\/[\w-]+\/[\w-]+' style={{textAlign: 'left', width: '100%'}}>
                                        <ul className={styles.mobile__dropdown}>
                                            <li>Men&apos;s Team</li>
                                            <li>Women&apos;s Team</li>
                                            <li>U21 Men&apos;s Team</li>
                                            <li>U21 Women&apos;s Team</li>
                                            <li>Youth Teams</li>
                                        </ul>
                                    </AccordionItem>

                                    <AccordionItem header="Season" url="^\/season\/\d{4}\/schedule\/[a-zA-Z0-9_]+\/[\w-]+">
                                        <ul className={styles.mobile__dropdown}>
                                            <li>Standings</li>
                                            <li>Schedule</li>
                                        </ul>
                                    </AccordionItem>

                                    <AccordionItem header="Club" url='club'>
                                        <ul className={styles.mobile__dropdown}>
                                            <li>History</li>
                                            <li>Management</li>
                                            <li>Our Partners</li>
                                        </ul>
                                    </AccordionItem>

                                    <Link className={styles.navItemLink} href="/contact-us"><p>Contact Us</p></Link>
                                </Accordion>
                            )
                        }
                    </nav>
                </div>
            </header>
        </>
    )
}