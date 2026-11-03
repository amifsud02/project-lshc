/**
 * Fills each player's "Squad pages" from this season's line-ups and copies positions from the old
 * squad lists. Only adds; never removes a squad or replaces a position.
 *   pnpm seed-squads            (DRY_RUN=1 lists the changes without saving them)
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import { seedSquads } from '../lib/seed/squads'

const payload = await getPayload({ config })
const dryRun = process.env.DRY_RUN === '1'
const results = await seedSquads(payload, { dryRun })
for (const r of results) console.log(`${r.name}: ${r.squads.join(', ') || '-'}${r.position ? ` (${r.position})` : ''}`)
console.log(`${results.length} players ${dryRun ? 'would be updated (dry run)' : 'updated'}`)
process.exit(0)
