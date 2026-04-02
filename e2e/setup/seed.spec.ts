import { test as setup } from '@playwright/test';
import { execSync } from 'child_process';

/**
 * Setup project: Seeds E2E data after webServer is ready
 * This runs as a dependency before the main test projects
 */
setup('seed E2E data', async () => {
  console.log('🌱 Running E2E seed...');
  try {
    execSync('node scripts/seed-e2e.cjs', { stdio: 'inherit' });
    console.log('✅ E2E seed complete');
  } catch (error) {
    console.error('❌ E2E seed failed:', error);
    throw error;
  }
});
