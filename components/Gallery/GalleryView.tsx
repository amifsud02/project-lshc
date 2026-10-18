import type { Gallery, Media } from "@/payload-types";
import PhotoGallery, { type GalleryPhoto } from "./PhotoGallery";
import styles from "./GalleryView.module.css";

type Props = {
    data: Gallery;
    images: Media[];
};

function formatDate(value: string) {
    return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

const GalleryView = ({ data, images }: Props) => {
    const photos: GalleryPhoto[] = images
        .filter((img) => img.url && !img.mimeType?.startsWith("video/"))
        .map((img) => ({ id: img.id, src: img.url!, alt: img.alt ?? "" }));
    const category = typeof data.tag === "object" && data.tag ? data.tag.title : null;

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1 className={styles.title}>{data.title}</h1>
                    <div className={styles.meta}>
                        <div className={styles.count} aria-label={`${photos.length} photos`}>
                            <span className={styles.countIcon}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                                    <rect x="3" y="3" width="18" height="18" rx="1" />
                                    <circle cx="9" cy="9" r="2" />
                                    <path d="M21 15l-5-5L5 21" />
                                </svg>
                            </span>
                            <span className={styles.countValue}>{photos.length}</span>
                        </div>
                        <div>
                            {data.description ? <p className={styles.description}>{data.description}</p> : null}
                            <div className={styles.overline}>
                                {category ? (
                                    <>
                                        <span>{category}</span>
                                        <span className={styles.dot}>•</span>
                                    </>
                                ) : null}
                                <time dateTime={data.publishedAt}>{formatDate(data.publishedAt)}</time>
                            </div>
                        </div>
                    </div>
                </header>

                {photos.length === 0 ? (
                    <p className={styles.empty}>No images in this gallery yet.</p>
                ) : (
                    <PhotoGallery photos={photos} />
                )}
            </div>
        </div>
    );
};

export default GalleryView;
