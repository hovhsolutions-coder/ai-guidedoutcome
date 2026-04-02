/*
  Warnings:

  - You are about to drop the column `dossierId` on the `activity_entries` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `activity_entries` table. All the data in the column will be lost.
  - You are about to drop the column `subtaskName` on the `activity_entries` table. All the data in the column will be lost.
  - You are about to drop the column `taskId` on the `activity_entries` table. All the data in the column will be lost.
  - You are about to drop the column `taskName` on the `activity_entries` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `dossiers` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `dossiers` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `dossiers` table. All the data in the column will be lost.
  - You are about to drop the column `objective` on the `dossiers` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `dossiers` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `dossiers` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `subtasks` table. All the data in the column will be lost.
  - You are about to drop the column `taskId` on the `subtasks` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `subtasks` table. All the data in the column will be lost.
  - You are about to drop the column `dependsOnTaskId` on the `task_dependencies` table. All the data in the column will be lost.
  - You are about to drop the column `taskId` on the `task_dependencies` table. All the data in the column will be lost.
  - You are about to drop the column `completedAt` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `dossierId` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `dueDate` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `tasks` table. All the data in the column will be lost.
  - Added the required column `dossier_id` to the `activity_entries` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `dossiers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `dossiers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `task_id` to the `subtasks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `subtasks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `depends_on_task_id` to the `task_dependencies` table without a default value. This is not possible if the table is not empty.
  - Added the required column `task_id` to the `task_dependencies` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dossier_id` to the `tasks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `tasks` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "message_type" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dossier_id" TEXT NOT NULL,
    CONSTRAINT "chat_messages_dossier_id_fkey" FOREIGN KEY ("dossier_id") REFERENCES "dossiers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_activity_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "task_name" TEXT,
    "old_value" TEXT,
    "new_value" TEXT,
    "batch_count" INTEGER,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dossier_id" TEXT NOT NULL,
    "task_id" TEXT,
    CONSTRAINT "activity_entries_dossier_id_fkey" FOREIGN KEY ("dossier_id") REFERENCES "dossiers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "activity_entries_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_activity_entries" ("id", "timestamp", "type") SELECT "id", "timestamp", "type" FROM "activity_entries";
DROP TABLE "activity_entries";
ALTER TABLE "new_activity_entries" RENAME TO "activity_entries";
CREATE INDEX "activity_entries_dossier_id_idx" ON "activity_entries"("dossier_id");
CREATE INDEX "activity_entries_timestamp_idx" ON "activity_entries"("timestamp");
CREATE INDEX "activity_entries_type_idx" ON "activity_entries"("type");
CREATE TABLE "new_dossiers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "situation" TEXT NOT NULL DEFAULT 'No situation provided',
    "main_goal" TEXT NOT NULL DEFAULT 'No goal specified',
    "phase" TEXT NOT NULL DEFAULT 'Understanding',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "last_activity" TEXT NOT NULL DEFAULT 'Dossier created',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "character_profile" TEXT,
    "progression_state" TEXT,
    "narrative" TEXT,
    "system_plan" TEXT,
    "execution_plan" TEXT
);
INSERT INTO "new_dossiers" ("id", "phase") SELECT "id", "phase" FROM "dossiers";
DROP TABLE "dossiers";
ALTER TABLE "new_dossiers" RENAME TO "dossiers";
CREATE INDEX "dossiers_phase_idx" ON "dossiers"("phase");
CREATE INDEX "dossiers_created_at_idx" ON "dossiers"("created_at");
CREATE INDEX "dossiers_progress_idx" ON "dossiers"("progress");
CREATE TABLE "new_subtasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "task_id" TEXT NOT NULL,
    CONSTRAINT "subtasks_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_subtasks" ("completed", "id", "name") SELECT "completed", "id", "name" FROM "subtasks";
DROP TABLE "subtasks";
ALTER TABLE "new_subtasks" RENAME TO "subtasks";
CREATE INDEX "subtasks_task_id_idx" ON "subtasks"("task_id");
CREATE TABLE "new_task_dependencies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "task_id" TEXT NOT NULL,
    "depends_on_task_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "task_dependencies_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "task_dependencies_depends_on_task_id_fkey" FOREIGN KEY ("depends_on_task_id") REFERENCES "tasks" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_task_dependencies" ("id") SELECT "id" FROM "task_dependencies";
DROP TABLE "task_dependencies";
ALTER TABLE "new_task_dependencies" RENAME TO "task_dependencies";
CREATE INDEX "task_dependencies_task_id_idx" ON "task_dependencies"("task_id");
CREATE INDEX "task_dependencies_depends_on_task_id_idx" ON "task_dependencies"("depends_on_task_id");
CREATE UNIQUE INDEX "task_dependencies_task_id_depends_on_task_id_key" ON "task_dependencies"("task_id", "depends_on_task_id");
CREATE TABLE "new_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "priority" TEXT,
    "category" TEXT,
    "due_date" TEXT,
    "estimate" TEXT,
    "actual_time" INTEGER NOT NULL DEFAULT 0,
    "is_tracking" BOOLEAN NOT NULL DEFAULT false,
    "tracking_started_at" TEXT,
    "milestone" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "dossier_id" TEXT NOT NULL,
    CONSTRAINT "tasks_dossier_id_fkey" FOREIGN KEY ("dossier_id") REFERENCES "dossiers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_tasks" ("category", "estimate", "id", "milestone", "name", "priority") SELECT "category", "estimate", "id", "milestone", "name", "priority" FROM "tasks";
DROP TABLE "tasks";
ALTER TABLE "new_tasks" RENAME TO "tasks";
CREATE INDEX "tasks_dossier_id_idx" ON "tasks"("dossier_id");
CREATE INDEX "tasks_completed_idx" ON "tasks"("completed");
CREATE INDEX "tasks_priority_idx" ON "tasks"("priority");
CREATE INDEX "tasks_due_date_idx" ON "tasks"("due_date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "chat_messages_dossier_id_idx" ON "chat_messages"("dossier_id");

-- CreateIndex
CREATE INDEX "chat_messages_timestamp_idx" ON "chat_messages"("timestamp");
