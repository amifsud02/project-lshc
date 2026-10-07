// The page itself is a client component, so the caching settings live here: nothing is pre-built,
// each position renders on its first visit and is then cached.
export const revalidate = 3600

export function generateStaticParams() {
  return []
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
