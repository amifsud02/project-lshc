'use client'

import { useState } from 'react';
import Link from 'next/link';
import Image from "next/image";
import styles from './Mobile.module.css';
import { Menu, X, ChevronDown } from 'lucide-react';


import { Accordion, AccordionItem as Item } from '@szhsin/react-accordion';

const AccordionItem = ({ header, ...rest }) => (
    <Item
      {...rest}
      header={
        <>
          {header}
          <ChevronDown size={35} className={styles.chevron}/>
        </>
      }
      className={styles.item}
      buttonProps={{
        className: ({ isEnter }) =>
          `${styles.itemBtn} ${isEnter && styles.itemBtnExpanded}`
      }}
      contentProps={{ className: ({ isEnter }) => `${styles.itemContent} ${isEnter && styles.listExpanded}`}}
      panelProps={{ className: styles.itemPanel }}
    />
  );

export const MobileNav = () => {
    const [isOpen, setIsOpen] = useState(false);

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
                                    <Link className={styles.navItemLink} href="/"><p>Home</p></Link>

                                    <AccordionItem header="Teams">
                                        <ul className={styles.mobile__dropdown}>
                                            <li>Men's Team</li>
                                            <li>Women's Team</li>
                                            <li>U21 Men's Team</li>
                                            <li>U21 Women's Team</li>
                                            <li>Youth Teams</li>
                                        </ul>
                                    </AccordionItem>

                                    <AccordionItem header="Season">
                                        <ul className={styles.mobile__dropdown}>
                                            <li>Standings</li>
                                            <li>Schedule</li>
                                        </ul>
                                    </AccordionItem>

                                    <AccordionItem header="Club">
                                        <ul className={styles.mobile__dropdown}>
                                            <li>History</li>
                                            <li>Management</li>
                                            <li>Our Partners</li>
                                        </ul>
                                    </AccordionItem>

                                    <Link className={styles.navItemLink} href="/"><p>Contact Us</p></Link>
                                </Accordion>
                            )
                        }
                    </nav>
                </div>
            </header>
        </>
    )
}