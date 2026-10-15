'use client'

import { useId, useState, type ReactNode } from 'react'

/**
 * Tab strip for the Tabs layout block. Panels arrive already rendered on the
 * server; inactive ones stay in the DOM (hidden) so switching is instant.
 */
export default function BlockTabs({ labels, panels }: { labels: string[]; panels: ReactNode[] }) {
  const [selected, setSelected] = useState(0)
  const id = useId()

  return (
    <section className="parent" style={{ padding: '2rem 0' }}>
      <div className="tabs__wrapper">
        <div className="category" role="tablist">
          {labels.map((label, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              id={`${id}-tab-${i}`}
              aria-controls={`${id}-panel-${i}`}
              aria-selected={selected === i}
              className={selected === i ? 'tablinks active' : 'tablinks'}
              onClick={() => setSelected(i)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {panels.map((panel, i) => (
        <div
          key={i}
          role="tabpanel"
          id={`${id}-panel-${i}`}
          aria-labelledby={`${id}-tab-${i}`}
          hidden={selected !== i}
        >
          {panel}
        </div>
      ))}
    </section>
  )
}
