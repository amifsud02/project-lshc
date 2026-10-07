import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { statusTone } from '@/lib/account/data'

const tones = {
  ok: 'bg-emerald-600/10 text-emerald-700',
  warn: 'bg-amber-500/15 text-amber-700',
  bad: 'bg-destructive/10 text-destructive',
  muted: 'bg-muted text-muted-foreground',
} as const

export default function StatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <Badge className={cn('gap-1.5 rounded-full border-none px-2.5 py-0.5', tones[statusTone(status)])}>
      <span className="size-1.5 rounded-full bg-current" />
      {label}
    </Badge>
  )
}
