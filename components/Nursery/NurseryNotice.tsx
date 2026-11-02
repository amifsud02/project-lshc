import type { ReactNode } from 'react'

type Props = {
  /** Small label above the title, e.g. "Handball Academy". */
  tag?: string
  title: string
  children: ReactNode
  /** Buttons under the copy. */
  actions?: ReactNode
}

/** A club-navy panel for the academy's in-between states: no programme yet, registration closed. */
export default function NurseryNotice({ tag, title, children, actions }: Props) {
  return (
    <div className="nursery-notice">
      {tag ? <p className="nursery-notice__tag">{tag}</p> : null}
      <h2 className="nursery-notice__title">{title}</h2>
      <div className="nursery-notice__body">{children}</div>
      {actions ? <div className="nursery-notice__actions">{actions}</div> : null}
    </div>
  )
}
