/**
 * Playwright Global Setup
 * Runs E2E seed before test suite
 */

const { execSync } = require('child_process');

module.exports = async () => {
  console.log('🌱 Running E2E seed...');
  try {
    execSync('node scripts/seed-e2e.cjs', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ E2E seed failed:', error);
    process.exit(1);
  }
};
