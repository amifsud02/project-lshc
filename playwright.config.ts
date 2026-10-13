import { defineConfig } from '@playwright/test'

// End-to-end tests run against apps that are already running locally (see each spec's header).
export default defineConfig({
  testDir: './e2e',
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
})
