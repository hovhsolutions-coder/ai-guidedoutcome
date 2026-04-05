/**
 * E2E Test Setup Script
 * Creates deterministic seed data for Playwright tests
 * Runs before e2e suite to ensure consistent test environment
 */

const { PrismaClient } = require('@prisma/client');
const { randomBytes, scryptSync } = require('node:crypto');

const prisma = new PrismaClient();
const SEEDED_USER = {
  id: 'e2e-user-1',
  name: 'E2E User',
  email: 'e2e@guidedoutcome.app',
  password: 'Password123!',
};

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

async function seedE2EData() {
  console.log('🌱 Seeding E2E test data...');

  // Clean up ALL existing data first (ensure clean state)
  // Delete in correct order due to foreign key constraints
  await prisma.activityEntry.deleteMany({});
  await prisma.subtask.deleteMany({});
  await prisma.taskDependency.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.chatMessage.deleteMany({});
  await prisma.dossier.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🧹 Cleaned up all existing dossiers');

  const seededUser = await prisma.user.create({
    data: {
      id: SEEDED_USER.id,
      name: SEEDED_USER.name,
      email: SEEDED_USER.email,
      passwordHash: hashPassword(SEEDED_USER.password),
    },
  });

  // Create ready-to-execute dossier with tasks for mode-aware UI testing
  const executingDossier = await prisma.dossier.create({
    data: {
      id: 'e2e-test-dossier-1',
      ownerId: seededUser.id,
      title: 'E2E Test: Execution Mode',
      situation: 'Test situation for execution mode verification',
      mainGoal: 'Verify execution UI appears with mode-aware labels',
      phase: 'Executing',
      progress: 33,
      lastActivity: 'Task progress updated',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-15T00:00:00Z'),
      tasks: {
        create: [
          {
            name: 'First task - already completed',
            completed: true,
            priority: 'high',
            createdAt: new Date('2024-01-02T00:00:00Z'),
          },
          {
            name: 'Second task - current priority',
            completed: false,
            priority: 'high',
            createdAt: new Date('2024-01-03T00:00:00Z'),
          },
          {
            name: 'Third task - queued',
            completed: false,
            priority: 'medium',
            createdAt: new Date('2024-01-04T00:00:00Z'),
          }
        ]
      },
      activityEntries: {
        create: [
          {
            type: 'task_completed',
            description: 'Completed task "First task - already completed"',
            taskName: 'First task - already completed',
            timestamp: new Date('2024-01-10T00:00:00Z'),
          },
          {
            type: 'task_added',
            description: 'Added task "Second task - current priority"',
            taskName: 'Second task - current priority',
            timestamp: new Date('2024-01-11T00:00:00Z'),
          }
        ]
      }
    },
    include: {
      tasks: true,
      activityEntries: true,
    }
  });

  // Create structuring phase dossier for phase-aware testing
  const structuringDossier = await prisma.dossier.create({
    data: {
      id: 'e2e-test-dossier-2',
      ownerId: seededUser.id,
      title: 'E2E Test: Structuring Mode',
      situation: 'Test situation for structuring phase verification',
      mainGoal: 'Verify structuring UI appears with planning labels',
      phase: 'Structuring',
      progress: 15,
      lastActivity: 'Planning in progress',
      createdAt: new Date('2024-01-02T00:00:00Z'),
      updatedAt: new Date('2024-01-16T00:00:00Z'),
      tasks: {
        create: [
          {
            name: 'Define scope and requirements',
            completed: false,
            priority: 'high',
            createdAt: new Date('2024-01-05T00:00:00Z'),
          },
          {
            name: 'Identify stakeholders',
            completed: false,
            priority: 'medium',
            createdAt: new Date('2024-01-06T00:00:00Z'),
          }
        ]
      },
      activityEntries: {
        create: [
          {
            type: 'task_added',
            description: 'Added initial planning tasks',
            timestamp: new Date('2024-01-12T00:00:00Z'),
          }
        ]
      }
    },
    include: {
      tasks: true,
      activityEntries: true,
    }
  });

  // Create completed dossier for post-close-out state testing
  const completedDossier = await prisma.dossier.create({
    data: {
      id: 'e2e-test-dossier-3',
      ownerId: seededUser.id,
      title: 'E2E Test: Completed Mode',
      situation: 'Test situation for completed phase verification',
      mainGoal: 'Verify completed UI shows reference/review state instead of active-work',
      phase: 'Completed',
      progress: 100,
      lastActivity: 'All tasks completed - dossier closed out',
      createdAt: new Date('2024-01-03T00:00:00Z'),
      updatedAt: new Date('2024-01-20T00:00:00Z'),
      tasks: {
        create: [
          {
            name: 'Research requirements',
            completed: true,
            priority: 'high',
            createdAt: new Date('2024-01-07T00:00:00Z'),
          },
          {
            name: 'Implement solution',
            completed: true,
            priority: 'high',
            createdAt: new Date('2024-01-08T00:00:00Z'),
          },
          {
            name: 'Verify outcomes',
            completed: true,
            priority: 'medium',
            createdAt: new Date('2024-01-09T00:00:00Z'),
          }
        ]
      },
      activityEntries: {
        create: [
          {
            type: 'task_completed',
            description: 'Completed task "Research requirements"',
            taskName: 'Research requirements',
            timestamp: new Date('2024-01-13T00:00:00Z'),
          },
          {
            type: 'task_completed',
            description: 'Completed task "Implement solution"',
            taskName: 'Implement solution',
            timestamp: new Date('2024-01-17T00:00:00Z'),
          },
          {
            type: 'task_completed',
            description: 'Completed task "Verify outcomes"',
            taskName: 'Verify outcomes',
            timestamp: new Date('2024-01-18T00:00:00Z'),
          },
          {
            type: 'phase_changed',
            description: 'Phase changed from Executing to Completed',
            timestamp: new Date('2024-01-20T00:00:00Z'),
          }
        ]
      }
    },
    include: {
      tasks: true,
      activityEntries: true,
    }
  });

  console.log('✅ E2E test data seeded successfully');
  console.log(`   - Seeded user: ${SEEDED_USER.email} / ${SEEDED_USER.password}`);
  console.log('   - E2E Test: Execution Mode (phase: Executing, progress: 33%, tasks: 3)');
  console.log('   - E2E Test: Structuring Mode (phase: Structuring, progress: 15%, tasks: 2)');
  console.log('   - E2E Test: Completed Mode (phase: Completed, progress: 100%, tasks: 3)');
}

seedE2EData()
  .catch((e) => {
    console.error('❌ E2E seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
