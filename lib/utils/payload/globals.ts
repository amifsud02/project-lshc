import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import config from '@payload-config'

import {
  headerFromPayload,
  footerFromPayload,
  generalFromPayload,
  type NormalizedHeader,
  type NormalizedFooter,
  type NormalizedGeneral,
} from '@/lib/utils/normalize/globals'

const loadHeader = unstable_cache(
  async (): Promise<NormalizedHeader> => {
    const payload = await getPayload({ config })
    const doc = await payload.findGlobal({ slug: 'header', depth: 2 })
    return headerFromPayload(doc)
  },
  ['site-header'],
  { revalidate: 60, tags: ['global:header'] },
)

const loadFooter = unstable_cache(
  async (): Promise<NormalizedFooter> => {
    const payload = await getPayload({ config })
    const doc = await payload.findGlobal({ slug: 'footer', depth: 2 })
    return footerFromPayload(doc)
  },
  ['site-footer'],
  { revalidate: 60, tags: ['global:footer'] },
)

const loadGeneral = unstable_cache(
  async (): Promise<NormalizedGeneral> => {
    const payload = await getPayload({ config })
    const doc = await payload.findGlobal({ slug: 'general', depth: 1 })
    return generalFromPayload(doc)
  },
  ['site-general'],
  { revalidate: 60, tags: ['global:general'] },
)

export const getHeaderGlobal = () => loadHeader()
export const getFooterGlobal = () => loadFooter()
export const getGeneralGlobal = () => loadGeneral()
