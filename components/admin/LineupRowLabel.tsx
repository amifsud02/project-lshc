'use client'

import { useRowLabel } from '@payloadcms/ui'

type LineupRow = { number?: number | null; name?: string; goals?: number | null }

/** "7 · Jessica Agius · 3 goals" instead of "Player 01" on a collapsed line-up row. */
export const LineupRowLabel = () => {
  const { data, rowNumber } = useRowLabel<LineupRow>()
  if (!data?.name) return <span>Player {String((rowNumber ?? 0) + 1).padStart(2, '0')}</span>

  const parts = [data.number != null ? String(data.number) : null, data.name]
  if (data.goals) parts.push(`${data.goals} ${data.goals === 1 ? 'goal' : 'goals'}`)
  return <span>{parts.filter(Boolean).join(' · ')}</span>
}
