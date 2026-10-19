"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./PhotoGallery.module.css";

export type GalleryPhoto = {
    id: string;
    src: string;
    alt: string;
};

type Props = {
    photos: GalleryPhoto[];
};

// The layout repeats every 14 photos: five beside two squares, a pair of halves,
// the mirrored five, and another pair of halves.
const CYCLE = 14;
// Photos added each time the reader nears the bottom.
const BATCH = CYCLE;

// Every <Image> here is `unoptimized`: photos load straight from Cloudinary, never through
// Next's image optimizer or Cloudinary transformations, so a resize failing can't break the gallery.

type Block =
    | { kind: "feature"; mirrored: boolean; start: number; photos: GalleryPhoto[] }
    | { kind: "halves"; start: number; photos: GalleryPhoto[] };

function toBlocks(photos: GalleryPhoto[]): Block[] {
    const blocks: Block[] = [];
    let i = 0;
    let step = 0;
    while (i < photos.length) {
        const isFeature = step % 2 === 0;
        const remaining = photos.length - i;
        if (isFeature && remaining >= 5) {
            blocks.push({ kind: "feature", mirrored: step % 4 === 2, start: i, photos: photos.slice(i, i + 5) });
            i += 5;
        } else {
            // Halves, or the tail that is too short to fill a feature block.
            const count = isFeature ? remaining : Math.min(2, remaining);
            blocks.push({ kind: "halves", start: i, photos: photos.slice(i, i + count) });
            i += count;
        }
        step++;
    }
    return blocks;
}

const SIZES = {
    square: "(max-width: 639px) 50vw, 420px",
    small: "(max-width: 639px) 50vw, 420px",
    big: "(max-width: 639px) 50vw, 840px",
    half: "(max-width: 639px) 50vw, 640px",
};

type TileProps = {
    photo: GalleryPhoto;
    index: number;
    variant: keyof typeof SIZES;
    priority: boolean;
    onOpen: (index: number) => void;
};

function Tile({ photo, index, variant, priority, onOpen }: TileProps) {
    const [loaded, setLoaded] = useState(false);

    return (
        <button
            type="button"
            className={`${styles.tile} ${styles[variant]}`}
            onClick={() => onOpen(index)}
            aria-label={photo.alt ? `View photo: ${photo.alt}` : `View photo ${index + 1}`}
        >
            <Image
                src={photo.src}
                alt={photo.alt}
                fill
                unoptimized
                sizes={SIZES[variant]}
                priority={priority}
                loading={priority ? undefined : "lazy"}
                className={`${styles.img} ${loaded ? styles.loaded : ""}`}
                onLoad={() => setLoaded(true)}
            />
        </button>
    );
}

export default function PhotoGallery({ photos }: Props) {
    const [visible, setVisible] = useState(Math.min(BATCH, photos.length));
    const [open, setOpen] = useState<number | null>(null);
    const sentinel = useRef<HTMLDivElement>(null);

    // Render more photos as the reader scrolls towards the end of what is shown.
    useEffect(() => {
        const el = sentinel.current;
        if (!el || visible >= photos.length) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    setVisible((v) => Math.min(v + BATCH, photos.length));
                }
            },
            { rootMargin: "1200px 0px" },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [visible, photos.length]);

    // Clean copies stay on screen; downloads go through the watermarking route instead.
    // This only stops casual saving (right-click, drag, long-press), not screenshots.
    const blockSave = (e: React.SyntheticEvent) => {
        if ((e.target as HTMLElement).tagName === "IMG") e.preventDefault();
    };

    const blocks = toBlocks(photos.slice(0, visible));
    const tile = (photo: GalleryPhoto, index: number, variant: keyof typeof SIZES) => (
        <Tile key={photo.id} photo={photo} index={index} variant={variant} priority={index < 3} onOpen={setOpen} />
    );

    return (
        <>
            <div className={styles.gallery} onContextMenu={blockSave} onDragStart={blockSave}>
                {blocks.map((block) => {
                    if (block.kind === "halves") {
                        return (
                            <div key={block.start} className={styles.block}>
                                {block.photos.map((p, j) => (
                                    <div key={p.id} className={styles.halfCol}>
                                        {tile(p, block.start + j, "half")}
                                    </div>
                                ))}
                            </div>
                        );
                    }

                    // Photos are placed in reading order, so the lightbox steps through them as they appear.
                    const s = block.start;
                    const p = block.photos;
                    if (!block.mirrored) {
                        return (
                            <div key={s} className={styles.block}>
                                <div className={styles.squaresCol}>
                                    {tile(p[0], s, "square")}
                                    {tile(p[1], s + 1, "square")}
                                </div>
                                <div className={styles.featureCol}>
                                    <div className={styles.pair}>
                                        {tile(p[2], s + 2, "small")}
                                        {tile(p[3], s + 3, "small")}
                                    </div>
                                    {tile(p[4], s + 4, "big")}
                                </div>
                            </div>
                        );
                    }
                    return (
                        <div key={s} className={styles.block}>
                            <div className={styles.featureCol}>
                                {tile(p[0], s, "big")}
                                <div className={styles.pair}>
                                    {tile(p[1], s + 1, "small")}
                                    {tile(p[2], s + 2, "small")}
                                </div>
                            </div>
                            <div className={styles.squaresCol}>
                                {tile(p[3], s + 3, "square")}
                                {tile(p[4], s + 4, "square")}
                            </div>
                        </div>
                    );
                })}
            </div>
            {visible < photos.length ? <div ref={sentinel} aria-hidden className={styles.sentinel} /> : null}

            {open !== null ? (
                <Lightbox photos={photos} index={open} onChange={setOpen} onClose={() => setOpen(null)} />
            ) : null}
        </>
    );
}

type LightboxProps = {
    photos: GalleryPhoto[];
    index: number;
    onChange: (index: number) => void;
    onClose: () => void;
};

function Lightbox({ photos, index, onChange, onClose }: LightboxProps) {
    const total = photos.length;
    const photo = photos[index];
    const prev = useCallback(() => onChange((index - 1 + total) % total), [index, total, onChange]);
    const next = useCallback(() => onChange((index + 1) % total), [index, total, onChange]);
    const closeRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            else if (e.key === "ArrowLeft") prev();
            else if (e.key === "ArrowRight") next();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose, prev, next]);

    useEffect(() => {
        const overflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        closeRef.current?.focus();
        return () => {
            document.body.style.overflow = overflow;
        };
    }, []);

    // Warm the neighbouring photos so arrowing through feels instant.
    const neighbours = total > 1 ? [photos[(index + 1) % total], photos[(index - 1 + total) % total]] : [];

    return (
        <div
            className={styles.lightbox}
            role="dialog"
            aria-modal="true"
            aria-label="Photo viewer"
            onClick={onClose}
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
        >
            <div className={styles.lightboxBar} onClick={(e) => e.stopPropagation()}>
                <span className={styles.counter}>
                    {index + 1} / {total}
                </span>
                <div className={styles.actions}>
                    <a
                        href={`/api/gallery/download/${encodeURIComponent(photo.id)}`}
                        download
                        className={styles.downloadButton}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                            <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
                        </svg>
                        Download
                    </a>
                    <button ref={closeRef} type="button" className={styles.iconButton} onClick={onClose} aria-label="Close">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                            <path d="M6 6l12 12M18 6L6 18" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className={styles.lightboxStage}>
                <Image
                    key={photo.id}
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    unoptimized
                    sizes="100vw"
                    priority
                    className={styles.lightboxImg}
                    onClick={(e) => e.stopPropagation()}
                />
            </div>

            {total > 1 ? (
                <>
                    <button
                        type="button"
                        className={`${styles.iconButton} ${styles.navPrev}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            prev();
                        }}
                        aria-label="Previous photo"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                            <path d="M15 6l-6 6 6 6" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        className={`${styles.iconButton} ${styles.navNext}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            next();
                        }}
                        aria-label="Next photo"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                            <path d="M9 6l6 6-6 6" />
                        </svg>
                    </button>
                </>
            ) : null}

            <div className={styles.preload} aria-hidden>
                {neighbours.map((p) => (
                    <Image key={p.id} src={p.src} alt="" fill unoptimized sizes="100vw" />
                ))}
            </div>
        </div>
    );
}
