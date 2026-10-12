import Link from 'next/link'

type Props = {
  /** The listing's path, e.g. /news or /news/club-news. */
  basePath: string
  page: number
  totalPages: number
  /** Other query parameters to keep, such as the selected tag. */
  query?: Record<string, string | undefined>
}

const hrefFor = (basePath: string, page: number, query: Props['query']) => {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query ?? {})) if (value) params.set(key, value)
  if (page > 1) params.set('page', String(page))
  const qs = params.toString()
  return qs ? `${basePath}?${qs}` : basePath
}

const linkStyle: React.CSSProperties = {
  padding: '10px 16px',
  borderRadius: 999,
  border: '1px solid rgba(0,0,0,0.15)',
  fontWeight: 600,
  fontSize: 12,
  textTransform: 'uppercase',
}

/** Previous / next links for the news listings. Renders nothing when everything fits on one page. */
export default function Pagination({ basePath, page, totalPages, query }: Props) {
  if (totalPages <= 1) return null
  return (
    <nav
      aria-label="Pagination"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 40, flexWrap: 'wrap' }}
    >
      {page > 1 ? (
        <Link href={hrefFor(basePath, page - 1, query)} style={linkStyle} rel="prev">
          ← Newer
        </Link>
      ) : null}
      <span style={{ fontSize: 13 }}>
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={hrefFor(basePath, page + 1, query)} style={linkStyle} rel="next">
          Older →
        </Link>
      ) : null}
    </nav>
  )
}
