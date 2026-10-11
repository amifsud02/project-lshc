'use client'

import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useSession } from '@/components/Site/useSession'

/** On the shop's 404: lets admins open the hidden shop in preview mode, which shows it to them. */
export default function ShopPreviewHint() {
  const { isAdmin } = useSession()
  const pathname = usePathname()
  if (!isAdmin) return null

  return (
    <div className="flex flex-col items-center gap-3 pt-2">
      <p className="text-sm text-muted-foreground">
        If the shop is hidden from visitors, admins can open it in preview mode.
      </p>
      <Button render={<a href={`/api/preview?path=${encodeURIComponent(pathname)}`} />}>
        Preview the shop
      </Button>
    </div>
  )
}
