#!/usr/bin/env node
/**
 * Migration script: JSON dossiers → SQLite database via Prisma
 * 
 * Run: npx tsx scripts/migrate-json-to-db.ts
 */

import { prisma } from '../src/lib/prisma';
import fs from 'fs/promises';
import path from 'path';

interface JsonSubtask {
  id: string;
  name: string;
  completed: boolean;
}

interface JsonTask {
  name: string;
  notes?: string;
  priority?: 'high' | 'medium' | 'low';
  category?: string;
  dueDate?: string;
  estimate?: string;
  completed: boolean;
  milestone?: string;
  subtasks?: JsonSubtask[];
  dependencies?: string[];
}

interface JsonDossier {
  id: string;
  title: string;
  situation?: string;
  main_goal?: string;
  phase: string;
  progress: number;
  lastActivity?: string;
  createdAt: string;
  tasks: JsonTask[];
  completedTasks?: string[];
}

interface JsonData {
  version: number;
  dossiers: JsonDossier[];
}

async function migrateJsonToDatabase() {
  console.log('🔄 Starting JSON to Database migration...\n');

  // Read JSON file
  const jsonPath = path.join(process.cwd(), 'data', 'dossiers.json');
  const jsonContent = await fs.readFile(jsonPath, 'utf-8');
  const data: JsonData = JSON.parse(jsonContent);

  console.log(`📁 Found ${data.dossiers.length} dossiers in JSON file`);

  let migratedDossiers = 0;
  let migratedTasks = 0;
  let migratedSubtasks = 0;

  for (const jsonDossier of data.dossiers) {
    try {
      // Check if dossier already exists
      const existing = await prisma.dossier.findUnique({
        where: { id: jsonDossier.id }
      });

      if (existing) {
        console.log(`⏭️  Skipping existing dossier: ${jsonDossier.title}`);
        continue;
      }

      // Create dossier
      const dossier = await prisma.dossier.create({
        data: {
          id: jsonDossier.id,
          title: jsonDossier.title,
          situation: jsonDossier.situation,
          mainGoal: jsonDossier.main_goal,
          phase: jsonDossier.phase,
          lastActivity: jsonDossier.phase === 'Completed' ? 'Completed' : 'Dossier created',
          createdAt: new Date(jsonDossier.createdAt),
          updatedAt: new Date(),
        }
      });

      migratedDossiers++;

      // Create a map to track task name → ID for dependencies
      const taskNameToId = new Map<string, string>();
      const taskIdToName = new Map<string, string>();

      // First pass: create all tasks
      for (const jsonTask of jsonDossier.tasks) {
        const isCompleted = jsonDossier.completedTasks?.includes(jsonTask.name) || jsonTask.completed;

        const task = await prisma.task.create({
          data: {
            name: jsonTask.name,
            notes: jsonTask.notes,
            priority: jsonTask.priority,
            category: jsonTask.category,
            dueDate: jsonTask.dueDate || null,
            estimate: jsonTask.estimate,
            completed: isCompleted,
            completedAt: isCompleted ? new Date() : null,
            milestone: jsonTask.milestone,
            dossierId: dossier.id,
          }
        });

        taskNameToId.set(jsonTask.name, task.id);
        taskIdToName.set(task.id, jsonTask.name);
        migratedTasks++;

        // Create subtasks
        if (jsonTask.subtasks && jsonTask.subtasks.length > 0) {
          for (const jsonSubtask of jsonTask.subtasks) {
            await prisma.subtask.create({
              data: {
                name: jsonSubtask.name,
                completed: jsonSubtask.completed,
                taskId: task.id,
              }
            });
            migratedSubtasks++;
          }
        }
      }

      // Second pass: create dependencies
      for (const jsonTask of jsonDossier.tasks) {
        if (jsonTask.dependencies && jsonTask.dependencies.length > 0) {
          const taskId = taskNameToId.get(jsonTask.name);
          if (!taskId) continue;

          for (const depName of jsonTask.dependencies) {
            const dependsOnTaskId = taskNameToId.get(depName);
            if (dependsOnTaskId) {
              await prisma.taskDependency.create({
                data: {
                  taskId: taskId,
                  dependsOnTaskId: dependsOnTaskId,
                }
              });
            }
          }
        }
      }

      // Create initial activity entry
      await prisma.activityEntry.create({
        data: {
          type: 'dossier_created',
          description: `Migrated dossier "${jsonDossier.title}"`,
          dossierId: dossier.id,
        }
      });

      console.log(`✅ Migrated: ${jsonDossier.title} (${jsonDossier.tasks.length} tasks)`);

    } catch (error) {
      console.error(`❌ Failed to migrate ${jsonDossier.title}:`, error);
    }
  }

  console.log('\n📊 Migration Summary:');
  console.log(`   Dossiers: ${migratedDossiers}`);
  console.log(`   Tasks: ${migratedTasks}`);
  console.log(`   Subtasks: ${migratedSubtasks}`);
  console.log('\n✨ Migration complete!');
}

migrateJsonToDatabase()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
