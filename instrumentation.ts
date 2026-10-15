/**
 * Runs once when the Next.js server starts. Boots Payload with its cron scheduler
 * so scheduled jobs (payload.config.ts `jobs`) run on Railway without waiting for
 * someone to open the admin panel first.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  const [{ getPayload }, { default: config }] = await Promise.all([import('payload'), import('@payload-config')])
  await getPayload({ config, cron: true })
}
