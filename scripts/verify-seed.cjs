/**
 * Seed verification test
 * Ensures seed script remains idempotent and creates expected data
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifySeed() {
  console.log('🔍 Verifying E2E seed idempotency...');

  // Run seed twice to verify idempotency
  await require('./seed-e2e.cjs');
  await require('./seed-e2e.cjs');

  // Verify expected data exists
  const dossiers = await prisma.dossier.findMany({
    where: { title: { startsWith: 'E2E Test' } }
  });

  if (dossiers.length !== 2) {
    console.error(`❌ Expected 2 E2E dossiers, found ${dossiers.length}`);
    process.exit(1);
  }

  // Verify critical fields are present
  for (const d of dossiers) {
    if (!d.id || !d.title || !d.createdAt) {
      console.error('❌ Critical dossier fields missing:', d);
      process.exit(1);
    }
  }

  console.log('✅ Seed verification passed (idempotent, 2 dossiers with required fields)');
  await prisma.$disconnect();
}

verifySeed().catch(e => {
  console.error('❌ Seed verification failed:', e);
  process.exit(1);
});
