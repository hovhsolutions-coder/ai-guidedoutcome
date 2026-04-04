import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Guided Outcome E2E tests
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  globalSetup: undefined, // Removed - seed now runs via setup project
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: '**/e2e/setup/*.spec.ts',
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'npm run build && npm run start',
    env: {
      ...process.env,
      DATABASE_URL: 'file:./dev.db',
      PRISMA_SCHEMA: 'prisma/schema.prisma',
      DIRECT_URL: '',
    },
    url: 'http://localhost:3000',
    reuseExistingServer: false,
    timeout: 180000,
  },
});
