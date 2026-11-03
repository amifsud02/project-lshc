import { paths } from '@/lib/seo/site'
import { shopSettingsFromPayload, type ShopSettings } from '@/lib/shop/settings'
import { academyNoticeFromPayload, type AcademyNotice } from '@/lib/nursery/notices'

export type NavLink = {
  label: string
  href: string
  newTab?: boolean
}

export type MegaMenu = {
  description?: string
  descriptionLinks: NavLink[]
  columns: { heading?: string; links: NavLink[] }[]
}

export type NavItem = NavLink & {
  mega?: MegaMenu
}

export type NavButton = NavLink & {
  appearance: 'default' | 'outline'
}

export type NormalizedHeader = {
  navItems: NavItem[]
  /** At most two buttons beside the cart. */
  buttons: NavButton[]
}

export type NormalizedGeneral = {
  siteName?: string
  siteDescription?: string
  logoUrl?: string
  faviconUrl?: string
  fallbackImageUrl?: string
  /** News posts per page on the news listings. */
  postsPerPage: number
  shopVisibility: 'admins' | 'public'
  shop: ShopSettings
  academy: { noProgramme: AcademyNotice; registrationClosed: AcademyNotice }
}

export type NormalizedFooter = {
  clubName: string
  tagline?: string
  menuLinks: NavLink[]
  social: { facebook?: string; instagram?: string; tiktok?: string }
  contact: { email?: string; phone?: string }
  copyright: string
}

type PayloadLink = {
  type?: 'reference' | 'custom'
  newTab?: boolean
  label?: string
  url?: string
  reference?: {
    relationTo: string
    value: any
  }
} | null | undefined

const mediaUrl = (m: any): string | undefined => {
  if (!m || typeof m === 'string') return undefined
  return m.url ?? undefined
}

const hrefForDoc = (relationTo: string, doc: any): string => {
  const slug: string = doc?.slug ?? ''
  if (relationTo === 'pages') {
    if (!slug || slug === 'home') return '/'
    return `/${slug}`
  }
  if (relationTo === 'news') {
    // A post lives under its category; without a populated category, fall back to the news index.
    return paths.news(doc ?? {}) ?? '/news'
  }
  return '/'
}

export const resolveLink = (link: PayloadLink): NavLink | null => {
  if (!link) return null
  const label = link.label ?? ''
  if (!label) return null

  if (link.type === 'custom') {
    if (!link.url) return null
    return { label, href: link.url, newTab: link.newTab || undefined }
  }

  const ref = link.reference
  if (!ref || typeof ref.value !== 'object' || ref.value === null) return null
  return {
    label,
    href: hrefForDoc(ref.relationTo, ref.value),
    newTab: link.newTab || undefined,
  }
}

export const generalFromPayload = (doc: any): NormalizedGeneral => {
  const g = doc?.general ?? {}
  return {
    siteName: g.name,
    siteDescription: g.description,
    logoUrl: mediaUrl(g.logo),
    faviconUrl: mediaUrl(g.favicon),
    fallbackImageUrl: mediaUrl(g.fallbackImage),
    postsPerPage: Math.max(1, Math.floor(Number(doc?.reading?.postsPerPage) || 10)),
    // Anything other than an explicit 'public' keeps the shop hidden.
    shopVisibility: doc?.shop?.visibility === 'public' ? 'public' : 'admins',
    shop: shopSettingsFromPayload(doc?.shop),
    academy: {
      noProgramme: academyNoticeFromPayload(doc?.academy?.noProgramme, 'noProgramme'),
      registrationClosed: academyNoticeFromPayload(doc?.academy?.registrationClosed, 'registrationClosed'),
    },
  }
}

const resolveLinks = (rows: any[] | null | undefined): NavLink[] =>
  (rows ?? []).map((row) => resolveLink(row?.link)).filter(Boolean) as NavLink[]

const megaFromPayload = (item: any): MegaMenu | undefined => {
  if (!item?.enableMegaMenu) return undefined
  const columns = (item.columns ?? [])
    .map((col: any) => ({ heading: col?.heading || undefined, links: resolveLinks(col?.links) }))
    .filter((col: { links: NavLink[] }) => col.links.length > 0)
  if (!columns.length) return undefined
  return {
    description: item.description || undefined,
    descriptionLinks: resolveLinks(item.descriptionLinks),
    columns,
  }
}

export const headerFromPayload = (doc: any): NormalizedHeader => ({
  navItems: (doc?.menuLinks ?? [])
    .map((item: any) => {
      const top = resolveLink(item?.link)
      if (!top) return null
      const mega = megaFromPayload(item)
      return mega ? { ...top, mega } : top
    })
    .filter(Boolean) as NavItem[],
  buttons: (doc?.ctaButtons ?? [])
    .slice(0, 2)
    .map((row: any) => {
      const link = resolveLink(row?.link)
      return link ? { ...link, appearance: row.link.appearance === 'outline' ? 'outline' : 'default' } : null
    })
    .filter(Boolean) as NavButton[],
})

export const footerFromPayload = (doc: any): NormalizedFooter => {
  const rawCopyright: string = doc?.copyright ?? '© {year} - La Salle Handball Club'
  const year = new Date().getFullYear().toString()
  return {
    clubName: doc?.clubName ?? 'La Salle Handball Club',
    tagline: doc?.tagline ?? undefined,
    menuLinks: (doc?.menuLinks ?? [])
      .map((item: any) => resolveLink(item?.link))
      .filter(Boolean) as NavLink[],
    social: {
      facebook: doc?.social?.facebook,
      instagram: doc?.social?.instagram,
      tiktok: doc?.social?.tiktok,
    },
    contact: {
      email: doc?.contact?.email,
      phone: doc?.contact?.phone,
    },
    copyright: rawCopyright.replaceAll('{year}', year),
  }
}
