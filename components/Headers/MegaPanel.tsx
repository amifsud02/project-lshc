"use client"

import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import styles from './MegaPanel.module.css'
import type { MegaMenu, NavItem, NavLink } from '@/lib/utils/normalize/globals';

const targetProps = (newTab?: boolean) =>
    newTab ? { target: '_blank' as const, rel: 'noopener noreferrer' } : {}

const isExternal = (link: NavLink) => link.newTab || /^https?:\/\//.test(link.href)

/**
 * The full-width panel under the menu: the section's title, intro and links on the left
 * (inter.it), then grouped link columns and a featured card (payloadcms.com).
 */
export default function MegaPanel({
    item,
    mega,
    pathname,
    focusFirst = false,
}: {
    item: NavItem
    mega: MegaMenu
    pathname: string
    focusFirst?: boolean
}) {
    const { featured } = mega
    return (
        <div
            id="mega-panel"
            className={styles.panel}
            ref={(el) => { if (focusFirst) el?.querySelector<HTMLElement>('a')?.focus() }}
        >
            <div className={styles.inner}>
                <div className={styles.intro}>
                    <p className={styles.title}>{item.label}</p>
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

                {featured ? (
                    <FeaturedCard featured={featured} />
                ) : null}
            </div>
        </div>
    )
}

function FeaturedCard({ featured }: { featured: NonNullable<MegaMenu['featured']> }) {
    const body = (
        <>
            {featured.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- CMS media of any size; the card is small
                <img src={featured.imageUrl} alt="" className={styles.cardImage} loading="lazy" />
            ) : null}
            <span className={styles.cardBody}>
                {featured.tag ? <span className={styles.cardTag}>{featured.tag}</span> : null}
                <span className={styles.cardHeading}>{featured.heading}</span>
                {featured.link ? (
                    <span className={styles.cardCta}>
                        {featured.link.label}
                        {isExternal(featured.link) ? <ArrowUpRight size={16} aria-hidden /> : <ArrowRight size={16} aria-hidden />}
                    </span>
                ) : null}
            </span>
        </>
    )
    return featured.link ? (
        <Link href={featured.link.href} className={styles.card} {...targetProps(featured.link.newTab)}>
            {body}
        </Link>
    ) : (
        <div className={styles.card}>{body}</div>
    )
}
