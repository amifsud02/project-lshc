import PageHeader from "@/components/PageHeader/PageHeader";
import ContactForm from "./contact-form";
import Footer from "@/components/Footer/Footer";
import { Partners } from "@/components/Partners/Partners";

export default function ContactPage() {
  return (
    <>
      <PageHeader pageName="Contact Us" />
      <section className="parent">
        <ContactForm />
      </section>
      <Partners/>
      <Footer/>
    </>
  );
}
