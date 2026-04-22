import { imageBuilder, imageBuilderV2 } from '@/lib/utils/sanity/sanity.config'

export type NormalizedTeam = {
  name: string
  logoUrl?: string
}

export type NormalizedFixture = {
  id: string
  startDate: string
  venue?: string
  isFinished: boolean
  homeScore: number
  awayScore: number
  homeTeam: NormalizedTeam
  awayTeam: NormalizedTeam
  competition?: { name: string }
}

export type NormalizedStandingRow = {
  position: number
  team: NormalizedTeam
  matchesPlayed: number
  wins: number
  draws: number
  losses: number
  goalDifference: number
  points: number
}

export type NormalizedStanding = {
  title?: string
  rows: NormalizedStandingRow[]
}

const isFinishedStatus = (s?: string) => s === 'Finished' || s === 'Completed'

export const fixtureFromPayload = (f: any): NormalizedFixture => {
  const home = typeof f.homeTeam === 'object' && f.homeTeam ? f.homeTeam : null
  const away = typeof f.awayTeam === 'object' && f.awayTeam ? f.awayTeam : null
  const comp = typeof f.competition === 'object' && f.competition ? f.competition : null
  return {
    id: String(f.id),
    startDate: f.startDate,
    venue: f.venue,
    isFinished: isFinishedStatus(f.status),
    homeScore: Number(f.homeScore ?? 0),
    awayScore: Number(f.awayScore ?? 0),
    homeTeam: {
      name: home?.teamName ?? '—',
      logoUrl: home?.teamLogo?.url,
    },
    awayTeam: {
      name: away?.teamName ?? '—',
      logoUrl: away?.teamLogo?.url,
    },
    competition: comp ? { name: comp.competitionName } : undefined,
  }
}

export const fixtureFromSanity = (f: any): NormalizedFixture => {
  const home = f?.fixtureInfo?.homeTeam?.team
  const away = f?.fixtureInfo?.awayTeam?.team
  const comp = f?.fixtureInfo?.competition?.[0]
  return {
    id: String(f._id),
    startDate: f.startDate,
    venue: f.venue,
    isFinished: isFinishedStatus(f.status),
    homeScore: Number(f.homeScore ?? 0),
    awayScore: Number(f.awayScore ?? 0),
    homeTeam: {
      name: home?.name ?? '—',
      logoUrl: home?.logo?.asset?._ref
        ? imageBuilderV2.image(home.logo.asset._ref).url()
        : undefined,
    },
    awayTeam: {
      name: away?.name ?? '—',
      logoUrl: away?.logo?.asset?._ref
        ? imageBuilderV2.image(away.logo.asset._ref).url()
        : undefined,
    },
    competition: comp?.name ? { name: comp.name } : undefined,
  }
}

export const standingFromPayload = (s: any): NormalizedStanding => ({
  title: s.standingName,
  rows: [...(s.teams ?? [])]
    .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
    .map((row: any) => {
      const team = typeof row.team === 'object' && row.team ? row.team : null
      return {
        position: Number(row.position ?? 0),
        team: {
          name: team?.teamName ?? '—',
          logoUrl: team?.teamLogo?.url,
        },
        matchesPlayed: Number(row.matchesPlayed ?? 0),
        wins: Number(row.wins ?? 0),
        draws: Number(row.draws ?? 0),
        losses: Number(row.losses ?? 0),
        goalDifference: Number(row.goalDifference ?? 0),
        points: Number(row.points ?? 0),
      }
    }),
})

export const standingFromSanity = (s: any): NormalizedStanding => ({
  title: s.standingName,
  rows: (s?.teams ?? []).map((row: any) => ({
    position: Number(row.position ?? 0),
    team: {
      name: row?.team?.name ?? '—',
      logoUrl: row?.team?.logo?.asset?._ref
        ? imageBuilder.image(row.team.logo.asset._ref).url()
        : undefined,
    },
    matchesPlayed: Number(row.matchesPlayed ?? 0),
    wins: Number(row.wins ?? 0),
    draws: Number(row.draws ?? 0),
    losses: Number(row.losses ?? 0),
    goalDifference: Number(row.goalDifference ?? 0),
    points: Number(row.points ?? 0),
  })),
})
