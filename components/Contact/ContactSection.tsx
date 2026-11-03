import ContactForm from './ContactForm'
import './contact.css'
import '@/components/Shop/shop.css'

type Props = { heading?: string | null; intro?: string | null }

/** The "Contact form" page block: a heading, a line of copy and the form that emails the club. */
export default function ContactSection({ heading, intro }: Props) {
  return (
    <section className="parent shop">
      <div className="contact">
        {heading ? <h2 className="heading">{heading}</h2> : null}
        {intro ? <p className="lead">{intro}</p> : null}
        <ContactForm />
      </div>
    </section>
  )
}
