import type { Block } from 'payload'

export const NurseryProgrammeBlock: Block = {
  slug: 'nurseryProgramme',
  interfaceName: 'NurseryProgrammeBlock',
  labels: {
    singular: 'Academy Programme',
    plural: 'Academy Programmes',
  },
  fields: [
    {
      name: 'academyName',
      type: 'text',
      defaultValue: 'La Salle Handball Academy',
      admin: {
        description:
          'Used in search results and AI answers. The registration button, schedule, venues and fees come from the active Nursery Season.',
      },
    },
  ],
}
