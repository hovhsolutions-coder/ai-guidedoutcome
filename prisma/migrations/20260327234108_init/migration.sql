-- CreateTable
CREATE TABLE "dossiers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "phase" TEXT NOT NULL DEFAULT 'active',
    "objective" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priority" TEXT,
    "category" TEXT,
    "dueDate" DATETIME,
    "estimate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "milestone" TEXT,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "dossierId" TEXT NOT NULL,
    CONSTRAINT "tasks_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "dossiers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "subtasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "taskId" TEXT NOT NULL,
    CONSTRAINT "subtasks_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "task_dependencies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "dependsOnTaskId" TEXT NOT NULL,
    CONSTRAINT "task_dependencies_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "task_dependencies_dependsOnTaskId_fkey" FOREIGN KEY ("dependsOnTaskId") REFERENCES "tasks" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "activity_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "taskName" TEXT,
    "subtaskName" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT,
    "dossierId" TEXT NOT NULL,
    "taskId" TEXT,
    CONSTRAINT "activity_entries_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "dossiers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "activity_entries_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "task_dependencies_taskId_dependsOnTaskId_key" ON "task_dependencies"("taskId", "dependsOnTaskId");
