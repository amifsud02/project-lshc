import { notFound } from 'next/navigation'

// A placeholder that never got content: it answers 404 so search engines don't index an empty page.
// Season results live on /fixtures.
export default function SeasonPage() {
  notFound()
}
