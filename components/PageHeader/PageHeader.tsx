import styles from './PageHeader.module.css'
import Hero, { type HeroProps } from '@/components/Hero/Hero'

type InnerVariantProps = {
    variant?: 'inner';
    pageName: string;
}

type LandingVariantProps = {
    variant: 'landing';
} & HeroProps;

type PageHeaderProps = InnerVariantProps | LandingVariantProps;

const PageHeader = (props: PageHeaderProps) => {
    if (props.variant === 'landing') {
        const { variant: _variant, ...heroProps } = props;
        return <Hero {...heroProps} />;
    }

    return (
        <div className={styles.pageHeader}>
            <div className='parent'>
                <div className={styles.pageHeaderInfo}>
                    {/* <div className={styles.pageMap}>Home • {props.pageName}</div> */}
                    <div className={styles.pageTitle}>{props.pageName}</div>
                </div>
            </div>
        </div>

    );
}

export default PageHeader;
