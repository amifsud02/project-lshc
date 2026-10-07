import type { GlobalAfterChangeHook } from 'payload'
import { revalidatePath, revalidateTag } from 'next/cache'

export const revalidateGlobal =
  (tag: string): GlobalAfterChangeHook =>
  ({ doc, req: { payload } }) => {
    payload.logger.info(`Revalidating cache tag: ${tag}`)
    revalidateTag(tag)
    // Header, footer and site settings appear on every page, so refresh the cached pages too.
    revalidatePath('/', 'layout')
    return doc
  }
