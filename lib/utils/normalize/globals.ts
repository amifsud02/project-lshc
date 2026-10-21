export type NavLink = {
  label: string
  href: string
  newTab?: boolean
}

export type NavItem = NavLink & {
  dropdown?: NavLink[]
}

export type NormalizedHeader = {
  navItems: NavItem[]
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
  membershipPopup: MembershipPopupSettings
}

export type MembershipPopupSettings = {
  enabled: boolean
  badge?: string
  heading: string
  body?: string
  benefits: string[]
  imageUrl?: string
  ctaLabel: string
  ctaLink: string
  partnerNote?: string
  delaySeconds: number
  snoozeDays: number
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
    return slug ? `/news/${slug}` : '/news'
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
    membershipPopup: membershipPopupFromPayload(doc?.membershipPopup),
  }
}

const clampNumber = (value: unknown, fallback: number, min: number, max: number) => {
  const n = Number(value)
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback
}

const membershipPopupFromPayload = (p: any): MembershipPopupSettings => ({
  enabled: p?.enabled === true,
  badge: p?.badge || undefined,
  heading: p?.heading || 'Become a La Salle Handball member',
  body: p?.body || undefined,
  benefits: (p?.benefits ?? []).map((b: any) => b?.text).filter(Boolean),
  imageUrl: mediaUrl(p?.image),
  ctaLabel: p?.ctaLabel || 'View memberships',
  ctaLink: p?.ctaLink || '/membership',
  partnerNote: p?.partnerNote || undefined,
  delaySeconds: clampNumber(p?.delaySeconds, 6, 0, 120),
  snoozeDays: clampNumber(p?.snoozeDays, 14, 1, 365),
})

export const headerFromPayload = (doc: any): NormalizedHeader => ({
  navItems: (doc?.menuLinks ?? [])
    .map((item: any) => {
      const top = resolveLink(item?.link)
      if (!top) return null
      const dropdown = (item?.dropdown ?? [])
        .map((d: any) => resolveLink(d?.link))
        .filter(Boolean) as NavLink[]
      return {
        ...top,
        dropdown: dropdown.length ? dropdown : undefined,
      }
    })
    .filter(Boolean) as NavItem[],
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
