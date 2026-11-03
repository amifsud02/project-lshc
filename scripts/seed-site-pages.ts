/**
 * Moves the club pages that used to be written in code (history, sponsors, management, contact,
 * youth teams, member benefits) into the CMS, published at the same addresses. Never edits a page
 * that already exists.
 *   pnpm seed-site-pages
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import { seedSitePages } from '../lib/seed/sitePages'

const payload = await getPayload({ config })
console.log('pages:', await seedSitePages(payload))
process.exit(0)
