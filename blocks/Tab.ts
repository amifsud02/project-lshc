import type { Block } from 'payload'
import { RichTextBlock } from './RichText'
import { AdSlotBlock } from './AdSlot'
import { CarouselBlock } from './Carousel'
import { FixtureListBlock } from './FixtureList'
import { StandingsBlock } from './Standings'
import { PlayerGridBlock } from './PlayerGrid'

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
