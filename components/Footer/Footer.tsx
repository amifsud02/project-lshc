import Link from "next/link";

import styles from './footer.module.css'

const Footer: React.FC<{}> = () => {
    return (
        <footer>
            <div className={styles.footer}>
                <div className={`${styles.footerContent} parent`}>
                    <div className={`${styles.fc40} ${styles.fcFlex} ${styles.fcWs}`}>
                        <div className="title">La Salle Handball Club</div>
                        <div>An amateur club with a professional mentality.</div>

                        <div className={styles.socialLinks}>
                            <a className={styles.fbIcon} href="https://www.facebook.com">
                                <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><path fill="white" d="M12.001 2.002c-5.522 0-9.999 4.477-9.999 9.999c0 4.99 3.656 9.126 8.437 9.879v-6.988h-2.54v-2.891h2.54V9.798c0-2.508 1.493-3.891 3.776-3.891c1.094 0 2.24.195 2.24.195v2.459h-1.264c-1.24 0-1.628.772-1.628 1.563v1.875h2.771l-.443 2.891h-2.328v6.988C18.344 21.129 22 16.992 22 12.001c0-5.522-4.477-9.999-9.999-9.999z" /></svg>
                            </a>
                            <a className={styles.instaIcon} href="https://www.instagram.com">
                                <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><path fill="white" d="M11.999 7.377a4.623 4.623 0 1 0 0 9.248a4.623 4.623 0 0 0 0-9.248zm0 7.627a3.004 3.004 0 1 1 0-6.008a3.004 3.004 0 0 1 0 6.008z" /><circle cx="16.806" cy="7.207" r="1.078" fill="white" /><path fill="white" d="M20.533 6.111A4.605 4.605 0 0 0 17.9 3.479a6.606 6.606 0 0 0-2.186-.42c-.963-.042-1.268-.054-3.71-.054s-2.755 0-3.71.054a6.554 6.554 0 0 0-2.184.42a4.6 4.6 0 0 0-2.633 2.632a6.585 6.585 0 0 0-.419 2.186c-.043.962-.056 1.267-.056 3.71c0 2.442 0 2.753.056 3.71c.015.748.156 1.486.419 2.187a4.61 4.61 0 0 0 2.634 2.632a6.584 6.584 0 0 0 2.185.45c.963.042 1.268.055 3.71.055s2.755 0 3.71-.055a6.615 6.615 0 0 0 2.186-.419a4.613 4.613 0 0 0 2.633-2.633c.263-.7.404-1.438.419-2.186c.043-.962.056-1.267.056-3.71s0-2.753-.056-3.71a6.581 6.581 0 0 0-.421-2.217zm-1.218 9.532a5.043 5.043 0 0 1-.311 1.688a2.987 2.987 0 0 1-1.712 1.711a4.985 4.985 0 0 1-1.67.311c-.95.044-1.218.055-3.654.055c-2.438 0-2.687 0-3.655-.055a4.96 4.96 0 0 1-1.669-.311a2.985 2.985 0 0 1-1.719-1.711a5.08 5.08 0 0 1-.311-1.669c-.043-.95-.053-1.218-.053-3.654c0-2.437 0-2.686.053-3.655a5.038 5.038 0 0 1 .311-1.687c.305-.789.93-1.41 1.719-1.712a5.01 5.01 0 0 1 1.669-.311c.951-.043 1.218-.055 3.655-.055s2.687 0 3.654.055a4.96 4.96 0 0 1 1.67.311a2.991 2.991 0 0 1 1.712 1.712a5.08 5.08 0 0 1 .311 1.669c.043.951.054 1.218.054 3.655c0 2.436 0 2.698-.043 3.654h-.011z" /></svg>
                            </a>
                            <a className={styles.tiktokIcon} href="https://www.tiktok.com">
                                <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><path fill="white" d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74a2.89 2.89 0 0 1 2.31-4.64a2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg>
                            </a>
                        </div>
                    </div>

                    <div className={`${styles.fc30} ${styles.fcFlex} ${styles.fcRight} ${styles.fcWs}`}>
                        <div className="title">Contact Us</div>
                        <div className="fInfo"><a href="mailto:info@lasallehandball.com">info@lasallehandball.com</a></div>
                        <div className="fInfo">Mobile</div>
                    </div>
                </div>
            </div>

            <div className={`${styles.subFooter} parent`}>
                <div className={`${styles.sfContent}`}>
                    © {new Date().getFullYear()} - La Salle Handball Club
                </div>
                <div className={styles.sfContent}>
                    <p>Designed and Developed by</p>

                    <Link href='https://cgowt.com' target="_blank">
                        <svg className={styles.cgowtLogo} id="Layer_2" data-name="Layer 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 502.08 97.79">
                            <g id="Layer_9" data-name="Layer 9">
                                <g>
                                    <path d="m0,48.89C0,21.22,20.55,0,48.89,0c17.06,0,32.1,8.46,40.3,21.76l-18.54,10.75c-4.16-7.25-12.22-11.55-21.76-11.55-16.66,0-27.4,11.15-27.4,27.94s10.75,27.94,27.4,27.94c9.54,0,17.73-4.3,21.76-11.55l18.54,10.75c-8.06,13.3-23.1,21.76-40.3,21.76C20.55,97.79,0,76.56,0,48.89Z" fill="#042532" />
                                    <path d="m191,51.58c0,28.74-20.01,46.21-46.34,46.21-29.55,0-50.77-21.76-50.77-48.76S115.52,0,143.19,0c18,0,33.18,8.87,41.1,21.49l-18.27,10.48c-3.9-6.18-12.36-11.01-22.97-11.01-15.85,0-27.67,11.69-27.67,28.21s11.28,27.67,29.55,27.67c12.49,0,20.69-5.51,24.04-14.51h-25.12v-18.81h47.15v8.06Z" fill="#042532" />
                                    <path d="m296.84,48.89c0,15.62-6.98,29.2-17.92,38.05l-11.98-17.35c5.2-4.9,8.41-12.06,8.41-20.7,0-16.79-12.09-27.94-27.4-27.94-4.57,0-8.86,1-12.62,2.84l-11.96-17.33C230.6,2.34,238.99,0,247.95,0c27,0,48.89,21.22,48.89,48.89Z" fill="#042532" />
                                    <path d="m272.54,91.31c-7.22,4.14-15.62,6.48-24.58,6.48-27,0-48.89-21.22-48.89-48.89,0-15.62,6.98-29.2,17.92-38.05l11.98,17.35c-5.2,4.9-8.41,12.06-8.41,20.7,0,16.79,12.09,27.94,27.4,27.94,4.57,0,8.86-1,12.63-2.84l11.96,17.32Z" fill="#042532" />
                                    <path d="m298.19,1.88h22.57l16.25,65.82L355.14,1.88h17.46l18.13,65.82L406.99,1.88h22.57l-25.92,94.02h-24.45l-15.31-55.47-15.31,55.47h-24.45L298.19,1.88Z" fill="#042532" />
                                    <path d="m502.08,22.57h-24.18v73.34h-21.49V22.57h-24.18V1.88h69.85v20.69Z" fill="#042532" />
                                </g>
                            </g>
                        </svg>
                    </Link>
                </div>
            </div>
        </footer>

    );
}

export default Footer;
<s></s>