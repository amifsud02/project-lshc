import type { NurserySeason } from '@/payload-types'

/**
 * Everything the registration form needs that is not a data field: headings,
 * help text, which optional questions to ask and any season-specific extras.
 * Built on the server from the season's "Registration form" tab, with defaults
 * for seasons created before that tab existed, and small enough to ship to the
 * client as-is.
 */

export type FormSectionKey =
  | 'parent'
  | 'child'
  | 'group'
  | 'sessions'
  | 'health'
  | 'extra'
  | 'consents'
  | 'payment'

export type FormSectionCopy = { title: string; description?: string }

export type ExtraQuestionType = 'text' | 'textarea' | 'select' | 'checkbox'

export type ExtraQuestion = {
  id: string
  label: string
  type: ExtraQuestionType
  required: boolean
  hint?: string
  options: string[]
}

export type FormConfig = {
  closedMessage?: string
  sections: Record<FormSectionKey, FormSectionCopy>
  fields: {
    relationship: boolean
    school: boolean
    kitSize: boolean
    kitSizeHint?: string
    emergencyContact: boolean
    emergencyContactRequired: boolean
    medical: boolean
    medicalConsentLabel?: string
    notes: boolean
    notesLabel: string
  }
  extraQuestions: ExtraQuestion[]
  submitLabelCard: string
  submitLabelTransfer: string
}

const DEFAULT_TITLES: Record<FormSectionKey, string> = {
  parent: 'Parent or guardian',
  child: 'Your child',
  group: 'Age group',
  sessions: 'Sessions per week',
  health: 'Emergency contact and health',
  extra: 'A few more questions',
  consents: 'Consents',
  payment: 'Payment',
}

const DEFAULT_DESCRIPTIONS: Partial<Record<FormSectionKey, string>> = {
  health:
    'Health details are seen only by the nursery coordinator and are used to keep your child safe at training.',
}

const text = (value: unknown): string | undefined => {
  const trimmed = typeof value === 'string' ? value.trim() : ''
  return trimmed ? trimmed : undefined
}

export function buildFormConfig(season: NurserySeason): FormConfig {
  const form = season.registrationForm ?? {}
  const copy = form.sections ?? {}
  const fields = form.fields ?? {}

  const sections = Object.fromEntries(
    (Object.keys(DEFAULT_TITLES) as FormSectionKey[]).map((key) => {
      const entry = (copy as Record<string, { title?: string | null; description?: string | null }>)[
        key
      ]
      return [
        key,
        {
          title: text(entry?.title) ?? DEFAULT_TITLES[key],
          description: text(entry?.description) ?? DEFAULT_DESCRIPTIONS[key],
        },
      ]
    }),
  ) as Record<FormSectionKey, FormSectionCopy>

  return {
    closedMessage: text(form.closedMessage),
    sections,
    fields: {
      relationship: fields.relationship ?? true,
      school: fields.school ?? true,
      kitSize: fields.kitSize ?? true,
      kitSizeHint: text(fields.kitSizeHint) ?? 'e.g. 9–10 years',
      emergencyContact: fields.emergencyContact ?? true,
      emergencyContactRequired: Boolean(fields.emergencyContactRequired),
      medical: fields.medical ?? true,
      medicalConsentLabel:
        fields.medicalConsentLabel === undefined
          ? 'I consent to my child receiving emergency medical treatment if I cannot be reached.'
          : text(fields.medicalConsentLabel),
      notes: fields.notes ?? true,
      notesLabel: text(fields.notesLabel) ?? 'Anything else we should know',
    },
    extraQuestions: (form.extraQuestions ?? []).flatMap((question) => {
      const label = text(question.label)
      if (!label || !question.id) return []
      return [
        {
          id: question.id,
          label,
          type: (question.type ?? 'text') as ExtraQuestionType,
          required: Boolean(question.required),
          hint: text(question.hint),
          options: (question.options ?? []).map((option) => option.label).filter(Boolean),
        },
      ]
    }),
    submitLabelCard: text(form.submitLabelCard) ?? 'Continue to payment',
    submitLabelTransfer: text(form.submitLabelTransfer) ?? 'Complete registration',
  }
}

export type ExtraAnswerInput = Record<string, string | boolean>

/**
 * Checks the parent's answers against the questions the season actually asks
 * and returns them in the shape stored on the registration. A crafted request
 * can't smuggle in questions the admin never configured.
 */
export function collectExtraAnswers(
  questions: ExtraQuestion[],
  answers: ExtraAnswerInput | undefined,
): { ok: true; answers: { question: string; answer: string }[] } | { ok: false; error: string } {
  const collected: { question: string; answer: string }[] = []
  for (const question of questions) {
    const raw = answers?.[question.id]
    if (question.type === 'checkbox') {
      const checked = raw === true || raw === 'true'
      if (question.required && !checked) {
        return { ok: false, error: `Please confirm "${question.label}".` }
      }
      collected.push({ question: question.label, answer: checked ? 'Yes' : 'No' })
      continue
    }
    const value = typeof raw === 'string' ? raw.trim() : ''
    if (question.required && !value) {
      return { ok: false, error: `Please answer "${question.label}".` }
    }
    if (question.type === 'select' && value && !question.options.includes(value)) {
      return { ok: false, error: `Please choose one of the options for "${question.label}".` }
    }
    if (value) collected.push({ question: question.label, answer: value })
  }
  return { ok: true, answers: collected }
}
