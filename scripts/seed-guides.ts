/**
 * Adds the "Play handball in Malta" and "What is handball?" pages and the "How to follow La Salle"
 * post, published, if they don't exist yet. Never edits existing content.
 *   pnpm seed-guides
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import { seedGuidePages, seedGuidePost } from '../lib/seed/guides'

const payload = await getPayload({ config })
console.log('pages:', await seedGuidePages(payload))
console.log('post:', await seedGuidePost(payload))
process.exit(0)
