import Navbar from "../Hero/Navbar";
import styles from './PageHeader.module.css'

type PageProps = {
    pageName: string;
}

const PageHeader = (props: PageProps) => {
    return (

        <div className={styles.pageHeader}>
            <Navbar />
            <div className='parent'>
                <div className={styles.pageHeaderInfo}>
                    <div className={styles.pageMap}>Home • {props.pageName}</div>
                    <div className={styles.pageTitle}>{props.pageName}</div>
                </div>
            </div>
        </div>

    );
}

export default PageHeader;