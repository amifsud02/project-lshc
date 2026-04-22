import styles from './PageHeader.module.css'

type PageProps = {
    pageName: string;
    backgroundImage?: string;
}

const PageHeader = ({ pageName, backgroundImage }: PageProps) => {
    const style = backgroundImage
        ? {
            backgroundImage: `url("${backgroundImage}")`,
            backgroundPosition: 'center',
        }
        : undefined;

    return (
        <div className={styles.pageHeader} style={style}>
            <div className='parent' style={{ position: 'relative', zIndex: 2 }}>
                <div className={styles.pageHeaderInfo}>
                    {/* <div className={styles.pageMap}>Home • {pageName}</div> */}
                    <div className={styles.pageTitle}>{pageName}</div>
                </div>
            </div>
        </div>
    );
}

export default PageHeader;
