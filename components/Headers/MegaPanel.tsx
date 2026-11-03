"use client"

import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import styles from './MegaPanel.module.css'
import type { MegaMenu, NavLink } from '@/lib/utils/normalize/globals';

const targetProps = (newTab?: boolean) =>
    newTab ? { target: '_blank' as const, rel: 'noopener noreferrer' } : {}

const isExternal = (link: NavLink) => link.newTab || /^https?:\/\//.test(link.href)

/**
 * The full-width panel under the menu: a short intro and links on the left, then grouped
 * link columns (payloadcms.com).
 */
export default function MegaPanel({
    mega,
    pathname,
    focusFirst = false,
}: {
    mega: MegaMenu
    pathname: string
    focusFirst?: boolean
}) {
    return (
        <div
            id="mega-panel"
            className={styles.panel}
            ref={(el) => { if (focusFirst) el?.querySelector<HTMLElement>('a')?.focus() }}
        >
            <div className={styles.inner}>
                <div className={styles.intro}>
                    {mega.description ? <p className={styles.description}>{mega.description}</p> : null}
                    {mega.descriptionLinks.length ? (
                        <ul className={styles.introLinks}>
                            {mega.descriptionLinks.map((l) => (
                                <li key={l.href + l.label}>
                                    <Link href={l.href} className={styles.introLink} {...targetProps(l.newTab)}>
                                        {l.label}
                                        {isExternal(l) ? <ArrowUpRight size={16} aria-hidden /> : <ArrowRight size={16} aria-hidden />}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : null}
                </div>

                <div className={styles.columns}>
                    {mega.columns.map((col, i) => (
                        <div key={col.heading ?? i} className={styles.column}>
                            {col.heading ? <p className={styles.heading}>{col.heading}</p> : null}
                            <ul>
                                {col.links.map((l) => (
                                    <li key={l.href + l.label}>
                                        <Link
                                            href={l.href}
                                            className={`${styles.link} ${pathname === l.href ? styles.current : ''}`}
                                            aria-current={pathname === l.href ? 'page' : undefined}
                                            {...targetProps(l.newTab)}
                                        >
                                            {l.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    )
}
