import SquadPage from '@/components/Squad/SquadPage'

export default async function Page({ params }: { params: Promise<{ position: string }> }) {
  return <SquadPage squad="men-first-team" position={(await params).position} />
}
