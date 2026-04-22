"use client"

import { useState } from "react";
import Link from "next/link";
import { NavLink } from "../Header";
import styles from './Dropdown.module.css'

const Dropdown = ({ dropdown }: { dropdown: NavLink[] }) => {
    const [click, setClick] = useState(false);

    const handleClick = () => setClick(!click);

    return (
        <>
            <ul
                onClick={handleClick}
                className={`${click ? `${styles.dropdownMenu} clicked` : styles.dropdownMenu} ${styles.dropdownItems}`}

            >
                {dropdown.map((dropdownItem) => (
                    <li key={dropdownItem.label}>
                        <Link
                            href={dropdownItem.href}
                            className={styles.dropdownLink}
                            {...(dropdownItem.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                        >
                            {dropdownItem.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </>
    )
}

export default Dropdown