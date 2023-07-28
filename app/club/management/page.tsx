import Footer from "@/components/Footer/Footer";
import PageHeader from "@/components/PageHeader/PageHeader";
import { Partners } from "@/components/Partners/Partners";

const Management = () => {
    return (
        <>
            <PageHeader pageName='Management'/>
            <section className="parent"></section>
            <Partners/>
            <Footer/>
        </>
    )
}

export default Management;