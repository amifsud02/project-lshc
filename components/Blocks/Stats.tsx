import './blocks.css'

type Props = { heading?: string | null; items?: { value: string; label: string; id?: string | null }[] | null }

/** A row of two to four headline facts about the club. */
export default function Stats({ heading, items }: Props) {
  const facts = (items ?? []).filter((f) => f.value && f.label)
  if (!facts.length) return null
  return (
    <section className="parent block-stats">
      {heading ? <h2 className="section-title">{heading}</h2> : null}
      <dl className="block-stats__grid">
        {facts.map((f, i) => (
          <div key={f.id ?? i} className="block-stats__item">
            <dt className="block-stats__label">{f.label}</dt>
            <dd className="block-stats__value">{f.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
