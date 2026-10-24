import styles from './PageHeader.module.css'
import Hero, { type HeroProps } from '@/components/Hero/Hero'

type InnerVariantProps = {
    variant?: 'inner';
    pageName: string;
    /** Renders the title as the page's <h1>, for pages with no other main heading. */
    asHeading?: boolean;
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

    const Title = props.asHeading ? 'h1' : 'div';

    return (
        <div className={styles.pageHeader}>
            <div className='parent'>
                <div className={styles.pageHeaderInfo}>
                    {/* <div className={styles.pageMap}>Home • {props.pageName}</div> */}
                    <Title className={styles.pageTitle}>{props.pageName}</Title>
                </div>
            </div>
        </div>

    );
}

export default PageHeader;
