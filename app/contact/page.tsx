import PageHeader from "@/components/PageHeader/PageHeader";
import ContactForm from "./contact-form";

export default function ContactPage() {
    return (
        <>
            <PageHeader pageName="Contact Us" />
            <main>
                <section className="parent">
                    <ContactForm />
                </section>
            </main>
        </>
    )
}