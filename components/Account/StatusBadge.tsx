import { statusTone } from '@/lib/account/data'

export default function StatusBadge({ status, label }: { status: string; label: string }) {
  return <span className={`account-badge account-badge--${statusTone(status)}`}>{label}</span>
}
