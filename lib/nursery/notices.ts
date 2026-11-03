export type AcademyNoticeButton = { label: string; url: string; style: 'light' | 'outline' }

export type AcademyNotice = {
  tag?: string
  title: string
  text?: string
  buttons: AcademyNoticeButton[]
}

/** What the academy notices say until an editor changes them in Site Settings → Academy. */
export const ACADEMY_NOTICE_DEFAULTS: Record<'noProgramme' | 'registrationClosed', AcademyNotice> = {
  noProgramme: {
    tag: 'Next season',
    title: 'The new programme is on its way',
    text: "Training groups, times, venues and fees for next season will be published here soon, and online registration opens at the same time. Questions in the meantime? Get in touch and we'll help.",
    buttons: [
      { label: 'Contact the club', url: '/contact', style: 'light' },
      { label: 'Play handball in Malta', url: '/play-handball', style: 'outline' },
    ],
  },
  registrationClosed: {
    tag: 'Handball Academy',
    title: 'Registration is closed',
    text: 'Online registration is closed at the moment. It opens again when the next season’s programme is published.',
    buttons: [
      { label: 'About the academy', url: '/academy', style: 'light' },
      { label: 'Contact the club', url: '/contact', style: 'outline' },
    ],
  },
}

/** A notice from Site Settings, falling back to the defaults for anything left empty. */
export const academyNoticeFromPayload = (raw: any, key: keyof typeof ACADEMY_NOTICE_DEFAULTS): AcademyNotice => {
  const d = ACADEMY_NOTICE_DEFAULTS[key]
  if (!raw) return d
  const buttons = Array.isArray(raw.buttons)
    ? raw.buttons
        .filter((b: any) => b?.label && b?.url)
        .slice(0, 2)
        .map((b: any) => ({ label: b.label, url: b.url, style: b.style === 'outline' ? 'outline' : 'light' }))
    : d.buttons
  return { tag: raw.tag || undefined, title: raw.title || d.title, text: raw.text || undefined, buttons }
}
