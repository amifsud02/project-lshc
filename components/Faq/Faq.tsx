import JsonLd from '@/components/Seo/JsonLd'
import { faqJsonLd } from '@/lib/seo/structuredData'
import './faq.css'

export type FaqItem = { question: string; answer: string; id?: string | null }

type Props = {
  heading?: string | null
  items?: FaqItem[] | null
  /** Path of the page the block sits on, for structured data. */
  pagePath?: string
}

/**
 * Questions parents and players ask, answered in plain text. The same text goes out as
 * FAQPage structured data, which search engines and AI assistants quote from.
 */
export default function Faq({ heading, items, pagePath }: Props) {
  const faqs = (items ?? []).filter((item) => item.question && item.answer)
  if (!faqs.length) return null

  return (
    <section className="parent faq">
      <JsonLd data={faqJsonLd(faqs, pagePath)} />
      <div className="faq__inner">
        <h2 className="section-title">{heading || 'Frequently asked questions'}</h2>
        {faqs.map((item, index) => (
          <details key={item.id ?? index} className="faq__item">
            <summary className="faq__question">{item.question}</summary>
            <p className="faq__answer">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
