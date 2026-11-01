import Link from 'next/link'
import './blocks.css'

type Step = { title: string; body: string; linkLabel?: string | null; linkUrl?: string | null; id?: string | null }
type Props = { heading?: string | null; intro?: string | null; items?: Step[] | null }

/** Numbered steps, e.g. how to start playing: the order is the point, so it's an ordered list. */
export default function Steps({ heading, intro, items }: Props) {
  const steps = (items ?? []).filter((s) => s.title && s.body)
  if (!steps.length) return null
  return (
    <section className="parent block-steps">
      {heading ? <h2 className="section-title">{heading}</h2> : null}
      {intro ? <p className="lead">{intro}</p> : null}
      <ol className="block-steps__list">
        {steps.map((s, i) => (
          <li key={s.id ?? i} className="block-steps__item">
            <span className="block-steps__num" aria-hidden="true">
              {i + 1}
            </span>
            <h3 className="block-steps__title">{s.title}</h3>
            <p className="block-steps__body">{s.body}</p>
            {s.linkLabel && s.linkUrl ? (
              <Link href={s.linkUrl} className="btn-text">
                {s.linkLabel}
              </Link>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  )
}
