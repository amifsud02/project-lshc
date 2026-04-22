import type { Block } from 'payload'
import { RichTextBlock } from './RichText.ts'
import { AdSlotBlock } from './AdSlot.ts'
import { CarouselBlock } from './Carousel.ts'
import { FixtureListBlock } from './FixtureList.ts'
import { StandingsBlock } from './Standings.ts'
import { PlayerGridBlock } from './PlayerGrid.ts'

export const TabBlock: Block = {
  slug: 'tab',
  interfaceName: 'TabBlock',
  labels: {
    singular: 'Tabs',
    plural: 'Tab Groups',
  },
  fields: [
    {
      name: 'tabs',
      type: 'array',
      minRows: 2,
      fields: [
        { name: 'label', type: 'text', required: true },
        {
          name: 'content',
          type: 'blocks',
          blocks: [
            RichTextBlock,
            AdSlotBlock,
            CarouselBlock,
            FixtureListBlock,
            StandingsBlock,
            PlayerGridBlock,
          ],
        },
      ],
    },
  ],
}
