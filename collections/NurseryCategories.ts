import type { CollectionConfig } from 'payload'
import { collectionWriteAccess } from '@/lib/auth/roles'
import { DAY_OPTIONS, isValidTime } from '@/lib/nursery/schedule'

/**
 * One age group within one season — "Under 8", "Under 13/15 Girls" and so on,
 * together with the training sessions that group actually gets.
 *
 * Categories are scoped to a season rather than shared across seasons: the
 * schedule is rewritten every year, and keeping last season's version intact is
 * what lets an old registration still explain what the parent signed up for.
 * At the start of a new season, duplicate the previous season's categories and
 * edit the times.
 *
 * Age groups overlap on purpose (Year 4 is eligible for both Under 8 and Under
 * 10), so eligibility is a filter that offers choices, never one that picks for
 * the parent.
 */
export const NurseryCategories: CollectionConfig = {
  slug: 'nursery-categories',
  labels: { singular: 'Nursery Category', plural: 'Nursery Categories' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'season', 'schoolYearsLabel', 'gender', 'displayOrder'],
    group: 'Nursery',
  },
  access: {
    create: collectionWriteAccess('nursery-categories'),
    delete: collectionWriteAccess('nursery-categories'),
    read: () => true,
    update: collectionWriteAccess('nursery-categories'),
  },
  defaultSort: 'displayOrder',
  fields: [
    {
      name: 'season',
      type: 'relationship',
      relationTo: 'nursery-seasons',
      required: true,
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'displayOrder',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description: 'Low numbers first — youngest group at the top.',
      },
    },
    {
      name: 'acceptingRegistrations',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Untick when the group is full. It still shows on the schedule.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          admin: { width: '60%', description: 'e.g. "Under 13/15 Girls"' },
        },
        {
          name: 'schoolYearsLabel',
          type: 'text',
          required: true,
          admin: { width: '40%', description: 'e.g. "Years 7–10"' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'gender',
          type: 'select',
          required: true,
          defaultValue: 'any',
          admin: { width: '34%' },
          options: [
            { label: 'Boys and girls', value: 'any' },
            { label: 'Boys only', value: 'boys' },
            { label: 'Girls only', value: 'girls' },
          ],
        },
        {
          name: 'birthYearFrom',
          type: 'number',
          required: true,
          admin: { width: '33%', description: 'Earliest year of birth accepted.' },
        },
        {
          name: 'birthYearTo',
          type: 'number',
          required: true,
          admin: { width: '33%', description: 'Latest year of birth accepted.' },
        },
      ],
    },
    {
      name: 'minSessionsPerWeek',
      type: 'number',
      required: true,
      defaultValue: 2,
      min: 1,
      admin: {
        description:
          'The fewest sessions a week this group may register for. Fee tiers below this are not offered. Under 6 is the exception at 1.',
      },
    },
    {
      name: 'sessions',
      type: 'array',
      required: true,
      minRows: 1,
      labels: { singular: 'Session', plural: 'Sessions' },
      admin: {
        description: 'The weekly training slots for this group.',
        initCollapsed: true,
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'day',
              type: 'select',
              required: true,
              options: [...DAY_OPTIONS],
              admin: { width: '34%' },
            },
            {
              name: 'startTime',
              type: 'text',
              required: true,
              admin: { width: '33%', description: '24-hour, e.g. 17:00' },
              validate: (value: unknown) =>
                isValidTime(value) || 'Use 24-hour HH:MM, e.g. 17:00',
            },
            {
              name: 'endTime',
              type: 'text',
              required: true,
              admin: { width: '33%', description: '24-hour, e.g. 18:30' },
              validate: (value: unknown) =>
                isValidTime(value) || 'Use 24-hour HH:MM, e.g. 18:30',
            },
          ],
        },
        {
          name: 'venue',
          type: 'relationship',
          relationTo: 'venues',
          required: true,
        },
        {
          name: 'note',
          type: 'text',
          admin: { description: 'Optional, shown next to the slot.' },
        },
      ],
    },
    {
      name: 'festivalNote',
      type: 'textarea',
      admin: {
        description:
          'Shown under this group’s schedule, e.g. the monthly Saturday festival at De La Salle.',
      },
    },
    {
      name: 'kitNote',
      type: 'textarea',
      admin: { description: 'What this group wears for festivals and competitions.' },
    },
  ],
}
