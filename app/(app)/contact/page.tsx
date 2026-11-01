import type { Metadata, ResolvingMetadata } from "next";
import { siteOpenGraph } from "@/lib/utils/metadata";
import PageHeader from "@/components/PageHeader/PageHeader";
import ContactForm from "./contact-form";
import Footer from "@/components/Footer/Footer";
import { Partners } from "@/components/Partners/Partners";
import AdSense from "@/components/AdSense/AdSense";
import { SITE_URL } from '@/lib/seo/site'

export const revalidate = 60

const title = 'Contact us'
const description = 'Contact La Salle Handball Club in Malta about playing, the Handball Academy, sponsorship or matches. Email info@lasallehandball.com.'
const baseSiteUrl = SITE_URL;
const canonical = `${baseSiteUrl}/contact`;

export async function generateMetadata(_: unknown, parent: ResolvingMetadata): Promise<Metadata> {
  return {
    title: title,
    description: description,
    alternates: {
      canonical: canonical
    },
    openGraph: await siteOpenGraph(parent, {
      title: title,
      description: description,

      url: canonical,
    }),
  };
}

export default function ContactPage() {
  return (
    <>
      <PageHeader pageName="Contact Us" asHeading />
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
