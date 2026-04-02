#!/usr/bin/env node
/**
 * Migration script: Import legacy JSON dossiers into SQLite
 * 
 * Usage:
 *   node scripts/migrate-to-sqlite.cjs
 * 
 * This script:
 * 1. Reads the legacy data/dossiers.json file
 * 2. Imports each dossier into the SQLite database via Prisma
 * 3. Preserves all data: tasks, subtasks, activity history, chat history
 * 4. Skips already-imported dossiers (idempotent)
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const DATA_DIR = path.join(process.cwd(), 'data');
const LEGACY_FILE = path.join(DATA_DIR, 'dossiers.json');

// Sanitization (matching the store logic)
const MAX_STRING_LENGTH = 5000;
const MAX_TASK_LENGTH = 500;

function sanitizeString(input, defaultValue) {
  if (typeof input !== 'string') return defaultValue;
  const trimmed = input.trim();
  if (trimmed.length === 0) return defaultValue;
  if (trimmed.length > MAX_STRING_LENGTH) return trimmed.slice(0, MAX_STRING_LENGTH);
  return trimmed;
}

function safeDate(input, defaultDate) {
  if (!input) return defaultDate;
  const parsed = new Date(input);
  if (isNaN(parsed.getTime())) return defaultDate;
  return parsed;
}

function validatePhase(input) {
  const validPhases = ['Understanding', 'Structuring', 'Executing', 'Completed'];
  if (typeof input === 'string' && validPhases.includes(input)) {
    return input;
  }
  return 'Understanding';
}

async function migrateDossier(legacyDossier) {
  // Check if already exists
  const existing = await prisma.dossier.findUnique({
    where: { id: legacyDossier.id },
  });

  if (existing) {
    console.log(`  ↷ Skip: ${legacyDossier.id} (${legacyDossier.title})`);
    return { status: 'skipped', id: legacyDossier.id };
  }

  try {
    // Normalize tasks (handle both string[] and Task[])
    const normalizedTasks = (legacyDossier.tasks || []).map((task, index) => {
      const taskObj = typeof task === 'string' ? { name: task } : task;
      const isCompleted = legacyDossier.completedTasks?.includes(taskObj.name) ?? false;

      return {
        name: taskObj.name?.slice(0, MAX_TASK_LENGTH) || `Task ${index + 1}`,
        notes: taskObj.notes?.slice(0, MAX_STRING_LENGTH) || null,
        priority: taskObj.priority || null,
        category: taskObj.category || null,
        dueDate: taskObj.dueDate || null,
        estimate: taskObj.estimate || null,
        actualTime: taskObj.actualTime || 0,
        isTracking: taskObj.isTracking || false,
        trackingStartedAt: taskObj.trackingStartedAt || null,
        milestone: taskObj.milestone || null,
        completed: isCompleted,
        subtasks: taskObj.subtasks?.map((sub) => ({
          name: sub.name?.slice(0, MAX_TASK_LENGTH) || 'Subtask',
          completed: sub.completed || false,
        })) || [],
      };
    });

    // Create dossier with all related data
    await prisma.dossier.create({
      data: {
        id: legacyDossier.id,
        title: sanitizeString(legacyDossier.title, 'Untitled Dossier'),
        situation: sanitizeString(legacyDossier.situation, 'No situation provided'),
        mainGoal: sanitizeString(legacyDossier.main_goal, 'No goal specified'),
        phase: validatePhase(legacyDossier.phase),
        progress: Math.max(0, Math.min(100, legacyDossier.progress ?? 0)),
        lastActivity: sanitizeString(legacyDossier.lastActivity, 'Imported from legacy'),
        createdAt: safeDate(legacyDossier.createdAt, new Date()),
        characterProfile: legacyDossier.characterProfile 
          ? JSON.stringify(legacyDossier.characterProfile).slice(0, MAX_STRING_LENGTH)
          : null,
        progressionState: legacyDossier.progressionState
          ? JSON.stringify(legacyDossier.progressionState).slice(0, MAX_STRING_LENGTH)
          : null,
        narrative: legacyDossier.narrative
          ? JSON.stringify(legacyDossier.narrative).slice(0, MAX_STRING_LENGTH)
          : null,
        systemPlan: legacyDossier.systemPlan
          ? JSON.stringify(legacyDossier.systemPlan).slice(0, MAX_STRING_LENGTH)
          : null,
        executionPlan: legacyDossier.executionPlan
          ? JSON.stringify(legacyDossier.executionPlan).slice(0, MAX_STRING_LENGTH)
          : null,
        tasks: {
          create: normalizedTasks.map((task) => ({
            name: task.name,
            notes: task.notes,
            priority: task.priority,
            category: task.category,
            dueDate: task.dueDate,
            estimate: task.estimate,
            actualTime: task.actualTime,
            isTracking: task.isTracking,
            trackingStartedAt: task.trackingStartedAt,
            milestone: task.milestone,
            completed: task.completed,
            subtasks: task.subtasks.length > 0 ? {
              create: task.subtasks,
            } : undefined,
          })),
        },
        activityEntries: {
          create: (legacyDossier.activityHistory || []).map((entry) => ({
            type: entry.type,
            description: sanitizeString(entry.description, ''),
            taskName: entry.taskName?.slice(0, MAX_TASK_LENGTH) || null,
            oldValue: entry.oldValue?.slice(0, MAX_STRING_LENGTH) || null,
            newValue: entry.newValue?.slice(0, MAX_STRING_LENGTH) || null,
            batchCount: entry.batchCount || null,
            timestamp: new Date(entry.timestamp || Date.now()),
          })),
        },
        chatMessages: {
          create: (legacyDossier.chatHistory || []).map((msg) => ({
            role: msg.role,
            content: typeof msg.content === 'string'
              ? msg.content.slice(0, MAX_STRING_LENGTH)
              : JSON.stringify(msg.content).slice(0, MAX_STRING_LENGTH),
            messageType: msg.messageType || null,
            timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp || Date.now()),
          })),
        },
      },
    });

    console.log(`  ✓ Imported: ${legacyDossier.id} (${legacyDossier.title})`);
    return { status: 'imported', id: legacyDossier.id };
  } catch (error) {
    console.error(`  ✗ Failed: ${legacyDossier.id} - ${error.message}`);
    return { status: 'failed', id: legacyDossier.id, error: error.message };
  }
}

async function main() {
  console.log('\n📦 Dossier Migration: JSON → SQLite\n');

  // Check if legacy file exists
  if (!fs.existsSync(LEGACY_FILE)) {
    console.log(`ℹ️  No legacy file found at ${LEGACY_FILE}`);
    console.log('   Nothing to migrate.\n');
    process.exit(0);
  }

  // Read legacy data
  let legacyData;
  try {
    const raw = fs.readFileSync(LEGACY_FILE, 'utf8');
    legacyData = JSON.parse(raw);
  } catch (error) {
    console.error(`✗ Failed to read legacy file: ${error.message}\n`);
    process.exit(1);
  }

  if (!Array.isArray(legacyData.dossiers)) {
    console.error('✗ Invalid legacy file format: dossiers array not found\n');
    process.exit(1);
  }

  const dossiers = legacyData.dossiers;
  console.log(`Found ${dossiers.length} dossier(s) to migrate\n`);

  // Migrate each dossier
  const results = {
    imported: 0,
    skipped: 0,
    failed: 0,
  };

  for (const dossier of dossiers) {
    const result = await migrateDossier(dossier);
    results[result.status]++;
  }

  // Summary
  console.log('\n📊 Migration Summary:');
  console.log(`   Imported: ${results.imported}`);
  console.log(`   Skipped (already exist): ${results.skipped}`);
  console.log(`   Failed: ${results.failed}`);
  console.log('');

  // Close Prisma connection
  await prisma.$disconnect();

  if (results.failed > 0) {
    process.exit(1);
  }
}

main().catch(async (error) => {
  console.error('\n✗ Migration failed:', error.message);
  await prisma.$disconnect();
  process.exit(1);
});
