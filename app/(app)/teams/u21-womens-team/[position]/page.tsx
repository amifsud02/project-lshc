import SquadPage from '@/components/Squad/SquadPage'

export default async function Page({ params }: { params: Promise<{ position: string }> }) {
  return <SquadPage squad="u21-womens-team" position={(await params).position} />
}
