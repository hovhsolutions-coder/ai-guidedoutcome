import { test as setup } from '@playwright/test';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Setup project: Seeds E2E data after webServer is ready
 * This runs as a dependency before the main test projects
 */
setup('seed E2E data', async () => {
  const lockPath = path.join(process.cwd(), 'test-results', '.e2e-seeded');
  if (fs.existsSync(lockPath)) {
    console.log('🌱 E2E seed already run - skipping for this worker');
    return;
  }

  console.log('🌱 Running E2E seed...');
  try {
    fs.mkdirSync(path.dirname(lockPath), { recursive: true });
    execSync('node scripts/seed-e2e.cjs', { stdio: 'inherit' });
    fs.writeFileSync(lockPath, `seeded at ${new Date().toISOString()}`);
    console.log('✅ E2E seed complete');
  } catch (error) {
    console.error('❌ E2E seed failed:', error);
    throw error;
  }
});
