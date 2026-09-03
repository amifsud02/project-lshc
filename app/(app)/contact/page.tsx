import PageHeader from "@/components/PageHeader/PageHeader";
import ContactForm from "./contact-form";
import Footer from "@/components/Footer/Footer";
import { Partners } from "@/components/Partners/Partners";
import AdSense from "@/components/AdSense/AdSense";

const title = 'La Salle Handball | Contact Us'
const description = 'Click here to reach out to our team regarding inquiries, job opportunities, future projects, or any other matters you find important.'
const baseSiteUrl = process.env.NEXT_PUBLIC_API_URL;
const canonical = `${baseSiteUrl}/contact`;

export const metadata = {
  title: title,
  description: description,
  alternates: {
    canonical: canonical
  },
  openGraph: {
    title: title,
    description: description,

    url: canonical,
  }
};

export default function ContactPage() {
  return (
    <>
      <PageHeader pageName="Contact Us" />
      <section className="parent">
        <AdSense adSlot='4410526483'></AdSense>
      </section>
      <section className="parent shop">
        <div className="contact">
          <h2 className="heading">Get in touch</h2>
          <p className="lead">
            Questions about the club, the nursery or anything else? Send us a message and we&apos;ll
            get back to you.
          </p>
          <ContactForm />
        </div>
      </section>
    </>
  );
}
