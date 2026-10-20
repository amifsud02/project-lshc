/**
 * Runs once when the Next.js server starts. Boots Payload with its cron scheduler
 * so scheduled jobs (payload.config.ts `jobs`) run on Railway without waiting for
 * someone to open the admin panel first.
 *
 * The Node-only code lives in its own module behind this exact check, so webpack can
 * leave it out of the edge build that middleware.ts brings in.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./instrumentation-node')
  }
}
