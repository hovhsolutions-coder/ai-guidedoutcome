/**
 * Critical Persistence Contract Test
 * Ensures dossier create/read always returns required fields
 * This guards against accidental schema changes breaking the persistence contract
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPersistenceContract() {
  console.log('🧪 Testing dossier persistence contract...');

  const testId = 'contract-test-' + Date.now();
  const testTitle = 'Contract Test Dossier';

  // CREATE - must return object with all required fields
  const created = await prisma.dossier.create({
    data: {
      id: testId,
      title: testTitle,
      situation: 'Test situation',
      mainGoal: 'Test goal',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  });

  if (!created.id || !created.title || !created.createdAt) {
    console.error('❌ CREATE: Critical fields missing in returned object');
    process.exit(1);
  }

  // READ - must retrieve same data
  const retrieved = await prisma.dossier.findUnique({
    where: { id: testId }
  });

  if (!retrieved || retrieved.title !== testTitle) {
    console.error('❌ READ: Data not persisted correctly');
    process.exit(1);
  }

  // CLEANUP
  await prisma.dossier.delete({ where: { id: testId } });

  console.log('✅ Persistence contract passed (create/read with required fields)');
  await prisma.$disconnect();
}

testPersistenceContract().catch(e => {
  console.error('❌ Persistence contract test failed:', e);
  process.exit(1);
});
