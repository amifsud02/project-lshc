import type { Block } from 'payload'

import { HeroBlock } from './Hero'
import { PageHeaderBlock } from './PageHeader'
import { FixtureListBlock } from './FixtureList'
import { StandingsBlock } from './Standings'
import { NewsSectionBlock } from './NewsSection'
import { PlayerGridBlock } from './PlayerGrid'
import { SponsorGridBlock } from './SponsorGrid'
import { PartnersBlock } from './Partners'
import { CarouselBlock } from './Carousel'
import { JoinUsBlock } from './JoinUs'
import { AdSlotBlock } from './AdSlot'
import { AdvertisementBlock } from './Advertisement'
import { CountdownBlock } from './Countdown'
import { RichTextBlock } from './RichText'
import { TabBlock } from './Tab'

export const PageLayoutBlocks: Block[] = [
  HeroBlock,
  PageHeaderBlock,
  RichTextBlock,
  NewsSectionBlock,
  FixtureListBlock,
  StandingsBlock,
  PlayerGridBlock,
  CarouselBlock,
  SponsorGridBlock,
  PartnersBlock,
  JoinUsBlock,
  CountdownBlock,
  TabBlock,
  AdvertisementBlock,
  AdSlotBlock,
]

export {
  HeroBlock,
  PageHeaderBlock,
  FixtureListBlock,
  StandingsBlock,
  NewsSectionBlock,
  PlayerGridBlock,
  SponsorGridBlock,
  PartnersBlock,
  CarouselBlock,
  JoinUsBlock,
  AdSlotBlock,
  AdvertisementBlock,
  CountdownBlock,
  RichTextBlock,
  TabBlock,
}
