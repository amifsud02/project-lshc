import styles from './yt.module.css';
import Footer from "@/components/Footer/Footer";
import PageHeader from "@/components/PageHeader/PageHeader";
import { Partners }from "@/components/Partners/Partners";

const YouthTeams = () => {   

    return (
        <>
            <PageHeader pageName='Youth Teams' />
            <section className={`parent ${styles.comingSoon}`}>
                <p>These are the Official Youth Squads for the season 2023/24</p>
                <h2>Coming Soon</h2>
            </section>
            <Partners/>
            <Footer/>
        </>
    )
}

export default YouthTeams;


