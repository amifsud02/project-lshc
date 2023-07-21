import { Header } from "../Headers/Header";
import { MobileNav } from "../Headers/MobileNavigation";
import styles from './PageHeader.module.css'

type PageProps = {
    pageName: string;
}

const PageHeader = (props: PageProps) => {
    return (
        <>
            <div className={styles.pageHeader}>
                <MobileNav />
                <div className={styles.parent}>
                    <div className={styles.pageHeaderInfo}>
                        <div className={styles.pageMap}>Home • {props.pageName}</div>
                        <div className={styles.pageTitle}>{props.pageName}</div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default PageHeader;