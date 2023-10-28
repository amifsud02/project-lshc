
import Navbar from '@/components/Hero/Navbar';
import styles from './PageHeader.module.css'

type PageProps = {
    pageName: string;
    backgroundImage?: any;
}

const PageHeader = (props: PageProps) => {
    return (

        <div className={styles.pageHeader} style={{ backgroundImage: `url(${props.backgroundImage})`, backgroundPosition: 'center' }}>
            <Navbar/>
            <div className='parent' style={{zIndex: '10'}}>
                <div className={styles.pageHeaderInfo}>
                    {/* <div className={styles.pageMap}>Home • {props.pageName}</div> */}
                    <div className={styles.pageTitle}>{props.pageName}</div>
                </div>
            </div>
        </div>

    );
}

export default PageHeader;