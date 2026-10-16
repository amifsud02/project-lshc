type Props = { data: Record<string, unknown> | Record<string, unknown>[] }

/**
 * Schema.org structured data for search engines and AI assistants. `<` is escaped so text from
 * the CMS can't close the script tag.
 */
export default function JsonLd({ data }: Props) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}
