import { statusTone } from '@/lib/account/data'

export default function StatusBadge({ status, label }: { status: string; label: string }) {
  return <span className={`badge badge--dot badge--${statusTone(status)}`}>{label}</span>
}
