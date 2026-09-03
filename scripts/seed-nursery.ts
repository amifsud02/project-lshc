import { getPayload } from 'payload'

import config from '../payload.config'

/**
 * Loads the 2026/2027 nursery programme — venues, season copy, fees and the full
 * training schedule — exactly as it appears in the letter sent to parents.
 *
 * Safe to re-run: it matches venues by name and the season by slug, and updates
 * rather than duplicating. Categories are rebuilt from scratch each run, so any
 * schedule edits made in the admin panel for this season will be overwritten.
 *
 *   pnpm seed-nursery
 */

const SEASON_SLUG = '2026-2027'

// ---------------------------------------------------------------------------
// Lexical helpers — the editor stores a node tree, not markdown.
// ---------------------------------------------------------------------------

const textNode = (text: string) => ({
  type: 'text',
  detail: 0,
  format: 0,
  mode: 'normal',
  style: '',
  text,
  version: 1,
})

const paragraphNode = (text: string) => ({
  type: 'paragraph',
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
  textFormat: 0,
  children: [textNode(text)],
})

const listNode = (items: string[]) => ({
  type: 'list',
  listType: 'bullet',
  tag: 'ul',
  start: 1,
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
  children: items.map((item, index) => ({
    type: 'listitem',
    value: index + 1,
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: [textNode(item)],
  })),
})

type Block = string | { list: string[] }

const richText = (...blocks: Block[]) => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: blocks.map((block) =>
      typeof block === 'string' ? paragraphNode(block) : listNode(block.list),
    ),
  },
})

// ---------------------------------------------------------------------------
// Source data
// ---------------------------------------------------------------------------

const VENUES = [
  { name: 'STMC Santa Lucia Secondary School Gym', locality: 'Santa Luċija' },
  { name: 'SMC Zabbar Primary B', locality: 'Żabbar' },
  { name: 'De La Salle College Gym', locality: 'Cospicua' },
  { name: 'STMC Fgura Primary B', locality: 'Fgura' },
  { name: 'Hamrun Handball Sports Pavilion', locality: 'Ħamrun' },
  { name: 'Cottonera Sports Complex', locality: 'Cospicua' },
  { name: 'University Sports Hall Msida', locality: 'Msida' },
] as const

type VenueName = (typeof VENUES)[number]['name']

type SeedSession = {
  day: string
  startTime: string
  endTime: string
  venue: VenueName
}

type SeedCategory = {
  name: string
  schoolYearsLabel: string
  gender: 'any' | 'boys' | 'girls'
  birthYearFrom: number
  birthYearTo: number
  minSessionsPerWeek: number
  displayOrder: number
  sessions: SeedSession[]
  festivalNote?: string
  kitNote: string
}

const JUNIOR_KIT = 'Traditional La Salle Handball kit (maroon shirt, grey shorts) and indoor sports shoes.'
const SENIOR_KIT =
  'The grey shorts of the original kit with the blue numbered shirt provided by the Club, and indoor sports shoes.'

/**
 * Birth years follow the Maltese scholastic-year cohorts for 2026/2027, where
 * Year 1 is the intake born in 2021. They are stored per season precisely so
 * that next year they shift by one without touching any code.
 */
const CATEGORIES: SeedCategory[] = [
  {
    name: 'Under 6',
    schoolYearsLabel: 'Kindergarten 2 and Year 1',
    gender: 'any',
    birthYearFrom: 2021,
    birthYearTo: 2022,
    minSessionsPerWeek: 1,
    displayOrder: 10,
    kitNote: JUNIOR_KIT,
    sessions: [
      { day: 'friday', startTime: '17:00', endTime: '18:15', venue: 'STMC Santa Lucia Secondary School Gym' },
    ],
  },
  {
    name: 'Under 8',
    schoolYearsLabel: 'Years 1–4',
    gender: 'any',
    birthYearFrom: 2018,
    birthYearTo: 2021,
    minSessionsPerWeek: 2,
    displayOrder: 20,
    kitNote: JUNIOR_KIT,
    sessions: [
      { day: 'monday', startTime: '14:45', endTime: '16:00', venue: 'SMC Zabbar Primary B' },
      { day: 'tuesday', startTime: '17:00', endTime: '18:30', venue: 'STMC Santa Lucia Secondary School Gym' },
      { day: 'wednesday', startTime: '15:00', endTime: '16:15', venue: 'De La Salle College Gym' },
      { day: 'thursday', startTime: '15:00', endTime: '16:15', venue: 'STMC Fgura Primary B' },
      { day: 'friday', startTime: '17:00', endTime: '18:15', venue: 'STMC Santa Lucia Secondary School Gym' },
    ],
  },
  {
    name: 'Under 10',
    schoolYearsLabel: 'Years 4–6',
    gender: 'any',
    birthYearFrom: 2016,
    birthYearTo: 2018,
    minSessionsPerWeek: 2,
    displayOrder: 30,
    kitNote: JUNIOR_KIT,
    sessions: [
      { day: 'monday', startTime: '14:45', endTime: '16:00', venue: 'SMC Zabbar Primary B' },
      { day: 'tuesday', startTime: '17:00', endTime: '18:30', venue: 'STMC Santa Lucia Secondary School Gym' },
      { day: 'wednesday', startTime: '15:00', endTime: '16:15', venue: 'De La Salle College Gym' },
      { day: 'thursday', startTime: '15:00', endTime: '16:15', venue: 'STMC Fgura Primary B' },
      { day: 'friday', startTime: '18:15', endTime: '19:30', venue: 'STMC Santa Lucia Secondary School Gym' },
    ],
  },
  {
    name: 'Under 13 Boys',
    schoolYearsLabel: 'Years 7–8',
    gender: 'boys',
    birthYearFrom: 2014,
    birthYearTo: 2015,
    minSessionsPerWeek: 2,
    displayOrder: 40,
    kitNote: JUNIOR_KIT,
    sessions: [
      { day: 'monday', startTime: '17:00', endTime: '18:30', venue: 'Hamrun Handball Sports Pavilion' },
      { day: 'thursday', startTime: '15:00', endTime: '16:30', venue: 'Cottonera Sports Complex' },
      { day: 'friday', startTime: '17:00', endTime: '18:30', venue: 'Hamrun Handball Sports Pavilion' },
    ],
  },
  {
    name: 'Under 13/15 Girls',
    schoolYearsLabel: 'Years 7–10',
    gender: 'girls',
    birthYearFrom: 2012,
    birthYearTo: 2015,
    minSessionsPerWeek: 2,
    displayOrder: 50,
    kitNote: JUNIOR_KIT,
    sessions: [
      { day: 'tuesday', startTime: '19:30', endTime: '21:00', venue: 'University Sports Hall Msida' },
      { day: 'thursday', startTime: '15:00', endTime: '16:30', venue: 'Cottonera Sports Complex' },
      { day: 'friday', startTime: '17:00', endTime: '18:30', venue: 'Hamrun Handball Sports Pavilion' },
    ],
  },
  {
    name: 'Under 15/17 Boys',
    schoolYearsLabel: 'Years 9–12',
    gender: 'boys',
    birthYearFrom: 2010,
    birthYearTo: 2013,
    minSessionsPerWeek: 2,
    displayOrder: 60,
    kitNote: SENIOR_KIT,
    sessions: [
      { day: 'monday', startTime: '17:00', endTime: '18:30', venue: 'Hamrun Handball Sports Pavilion' },
      { day: 'friday', startTime: '15:00', endTime: '16:30', venue: 'De La Salle College Gym' },
      { day: 'saturday', startTime: '08:30', endTime: '10:00', venue: 'De La Salle College Gym' },
    ],
  },
]

// ---------------------------------------------------------------------------

const payload = await getPayload({ config })

const venueIds = new Map<string, string>()

for (const venue of VENUES) {
  const { docs } = await payload.find({
    collection: 'venues',
    where: { name: { equals: venue.name } },
    limit: 1,
  })
  if (docs.length) {
    venueIds.set(venue.name, String(docs[0].id))
  } else {
    const created = await payload.create({ collection: 'venues', data: venue })
    venueIds.set(venue.name, String(created.id))
    console.log(`Created venue: ${venue.name}`)
  }
}

const seasonData = {
  title: '2026/2027',
  slug: SEASON_SLUG,
  isActive: true,
  firstTrainingDate: new Date('2026-10-12T00:00:00.000Z').toISOString(),
  introduction: richText(
    'La Salle Handball Club is proud to be one of Malta’s leading handball clubs. During the 2026/2027 season, the Club’s Nursery will once again offer structured, age-appropriate training programmes for boys and girls aged 5 to 16 years (Kindergarten 2 to Year 12).',
    'Our training programmes are designed to give every player the opportunity to develop in a fun, safe and encouraging environment. Younger players learn the fundamentals of mini handball through enjoyable games and activities, developing skills such as passing, catching, dribbling, shooting, creating space and working as a team. As players progress through the age groups, training focuses increasingly on technical and tactical development, game understanding, teamwork and decision-making, while continuing to ensure that every session is enjoyable.',
  ),
  attendanceNote: richText(
    'Children improve most when they train consistently and put into practice what they learn. For this reason, players — apart from those in the Under 6 category — are expected to attend at least two training sessions each week. Attending three sessions per week is highly recommended.',
    'Equally important is participation in the handball festivals, friendly matches and competitions organised throughout the season by the Malta Handball Association and La Salle Handball Club. These events give players the opportunity to apply their skills in real match situations, gain confidence, learn from experience and enjoy the social side of the sport. Regular attendance at both training sessions and festivals is the key to steady improvement.',
  ),
  festivalNote: richText(
    'Players in the Under 6, Under 8, Under 10 and Under 13 categories also take part in at least one festival each month organised by the LSHC, usually held on Saturday mornings at De La Salle College Gym (10:00 a.m. – 11:00 a.m.), in addition to the festivals and competitions organised by the Malta Handball Association.',
  ),
  trainingAttire: richText(
    'For training sessions, players may wear:',
    {
      list: [
        'The traditional La Salle Handball kit (maroon shirt and grey shorts),',
        'the blue La Salle Handball training kit, or',
        'comfortable sports clothing with suitable indoor sports shoes.',
      ],
    },
    'All training equipment, including handballs, bibs and cones, is provided by the Club. For festivals and competitions:',
  ),
  closingNote: richText(
    'We look forward to welcoming your child to another exciting season of learning, teamwork and enjoyment through handball.',
  ),
  feeTiers: [
    {
      value: 'one-session',
      label: '1 training session per week',
      sessionsPerWeek: 1,
      priceCents: 18000,
    },
    {
      value: 'two-sessions',
      label: '2 training sessions per week',
      sessionsPerWeek: 2,
      priceCents: 18000,
    },
    {
      value: 'three-sessions',
      label: '3 or more training sessions per week',
      sessionsPerWeek: 3,
      priceCents: 22000,
    },
  ],
  taxRebate: {
    enabled: true,
    copy: richText(
      'La Salle Handball Club is registered with SportMalta and is an approved provider of non-formal education. Parents may therefore benefit from the Government Tax Rebate Scheme. Subject to eligibility, a tax rebate of up to €300 per child may be claimed through the FS3 tax return. With your consent, the Club will process the necessary documentation on your behalf.',
    ),
    consentLabel:
      'I authorise La Salle Handball Club to process the tax rebate documentation on my behalf.',
  },
  allowCardPayment: true,
  allowBankTransfer: true,
  bankTransfer: {
    accountName: 'La Salle Handball Club',
    iban: '',
    swift: '',
    instructions:
      'Please quote your registration reference as the payment reference so we can match the transfer to your child. Places are held for 14 days pending payment.',
  },
  contact: {
    name: 'Chris Kenely',
    phone: '7904 6775',
    email: 'chris.kenely@lasallehandball.com',
  },
  // Drafted from the club's actual practice — have it reviewed before the form
  // goes live, since it is the basis on which parents consent.
  privacyNotice: richText(
    'La Salle Handball Club collects your child’s name, date of birth, school year and health information, together with your contact details, in order to run the nursery: to place your child in the right group, to contact you, to keep your child safe at training, and to register players with the Malta Handball Association.',
    'Health information is accessible only to the nursery coordinator and Club administrators. We do not share your data with anyone else except the Malta Handball Association where registration requires it, and our payment provider where you choose to pay by card. Registration records are kept for the duration of your child’s membership and for six years afterwards for accounting purposes.',
    'You may ask to see, correct or delete your child’s data at any time by contacting the Club.',
  ),
  privacyConsentLabel:
    'I have read the privacy notice and consent to the Club processing my child’s data for the purpose of running the nursery.',
  photoConsentLabel:
    'I consent to photographs and video of my child taken at Club activities being used on the Club’s website and social media.',
}

const { docs: existingSeasons } = await payload.find({
  collection: 'nursery-seasons',
  where: { slug: { equals: SEASON_SLUG } },
  limit: 1,
})

const season = existingSeasons.length
  ? await payload.update({
      collection: 'nursery-seasons',
      id: existingSeasons[0].id,
      data: seasonData as never,
    })
  : await payload.create({ collection: 'nursery-seasons', data: seasonData as never })

console.log(`${existingSeasons.length ? 'Updated' : 'Created'} season: ${season.title}`)

// Categories are rebuilt rather than merged: the schedule is the thing that
// changes most, and a half-updated week is worse than a replaced one.
const { docs: staleCategories } = await payload.find({
  collection: 'nursery-categories',
  where: { season: { equals: season.id } },
  limit: 100,
})

for (const stale of staleCategories) {
  await payload.delete({ collection: 'nursery-categories', id: stale.id })
}

for (const category of CATEGORIES) {
  await payload.create({
    collection: 'nursery-categories',
    data: {
      season: season.id,
      name: category.name,
      schoolYearsLabel: category.schoolYearsLabel,
      gender: category.gender,
      birthYearFrom: category.birthYearFrom,
      birthYearTo: category.birthYearTo,
      minSessionsPerWeek: category.minSessionsPerWeek,
      displayOrder: category.displayOrder,
      acceptingRegistrations: true,
      festivalNote: category.festivalNote,
      kitNote: category.kitNote,
      sessions: category.sessions.map((session) => ({
        day: session.day,
        startTime: session.startTime,
        endTime: session.endTime,
        venue: venueIds.get(session.venue)!,
      })),
    } as never,
  })
  console.log(`Created category: ${category.name} (${category.sessions.length} sessions)`)
}

console.log('\nDone. Review the season at /admin — the IBAN and the privacy notice need filling in.')
process.exit(0)
