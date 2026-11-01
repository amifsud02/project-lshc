import type { Metadata, ResolvingMetadata } from 'next'
import { notFound } from 'next/navigation'
import { SQUAD_POSITIONS, squadMetadata } from '@/lib/seo/teams'

// The page itself is a client component, so the caching settings live here: nothing is pre-built,
// each position renders on its first visit and is then cached.
export const revalidate = 3600

export function generateStaticParams() {
  return []
}

export async function generateMetadata(
  { params }: { params: Promise<{ position: string }> },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  return squadMetadata('u21-mens-team', (await params).position, parent)
}

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ position: string }>
}) {
  // Unknown positions are a 404 rather than the full squad again under another URL.
  if (!SQUAD_POSITIONS.includes((await params).position.toLowerCase())) notFound()
  return children
}
