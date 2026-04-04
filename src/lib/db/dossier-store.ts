import { prisma } from './prisma';
import { type MockDossier, type Task, type ActivityEntry, type DossierPhase } from '@/lib/mockData';
import { type ChatMessageData } from '@/components/chat/ChatMessage';
import { type GeneratedDossier } from '@/src/types/ai';

// ============================================
// TYPES & CONSTANTS
// ============================================

const MAX_STRING_LENGTH = 5000;
const MAX_TASKS = 100;
const MAX_TASK_LENGTH = 500;
const TEST_TITLE_PATTERNS = [/^e2e test/i, /^demo[:\s]/i, /\bseed\b/i, /\btest dossier\b/i];
const SHOULD_HIDE_TEST_DATA =
  process.env.VERCEL === '1' ||
  process.env.VERCEL_ENV === 'production' ||
  process.env.NEXT_PUBLIC_HIDE_TEST_DOSSIERS === 'true';

// ============================================
// SANITIZATION (preserved from original store)
// ============================================

function sanitizeString(input: unknown, defaultValue: string): string {
  if (typeof input !== 'string') return defaultValue;
  const trimmed = input.trim();
  if (trimmed.length === 0) return defaultValue;
  if (trimmed.length > MAX_STRING_LENGTH) return trimmed.slice(0, MAX_STRING_LENGTH);
  return trimmed;
}

function sanitizeTasks(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
    .map((t) => (t.length > MAX_TASK_LENGTH ? t.slice(0, MAX_TASK_LENGTH) : t))
    .slice(0, MAX_TASKS);
}

function validatePhase(input: unknown): DossierPhase {
  const normalized = typeof input === 'string' && input === 'Action' ? 'Executing' : input;
  const validPhases: DossierPhase[] = ['Understanding', 'Structuring', 'Executing', 'Completed'];
  if (typeof normalized === 'string' && validPhases.includes(normalized as DossierPhase)) {
    return normalized as DossierPhase;
  }
  return 'Understanding';
}

function formatCreatedAt(date: Date): string {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// ============================================
// VISIBILITY FILTERS (hide seed/demo/test data)
// ============================================

function isTestOrDemoDossier(dossier: { title?: string; main_goal?: string; mainGoal?: string }): boolean {
  const goal = dossier.main_goal ?? (dossier as any).mainGoal ?? '';
  const haystack = `${dossier.title ?? ''} ${goal}`.trim().toLowerCase();
  if (!haystack) return false;
  return TEST_TITLE_PATTERNS.some((pattern) => pattern.test(haystack));
}

export function filterVisibleDossiers<T extends { title?: string; main_goal?: string }>(dossiers: T[]): T[] {
  if (!SHOULD_HIDE_TEST_DATA) {
    return dossiers;
  }
  return dossiers.filter((dossier) => !isTestOrDemoDossier(dossier));
}

// ============================================
// CONVERSION: Prisma -> MockDossier (for backward compatibility)
// ============================================

function convertPrismaDossierToMockDossier(prismaDossier: any): MockDossier {
  const tasks: Task[] = prismaDossier.tasks.map((t: any) => ({
    name: t.name,
    notes: t.notes ?? undefined,
    priority: (t.priority as Task['priority']) ?? undefined,
    category: t.category ?? undefined,
    dueDate: t.dueDate ?? undefined,
    estimate: t.estimate ?? undefined,
    actualTime: t.actualTime ?? undefined,
    isTracking: t.isTracking ?? undefined,
    trackingStartedAt: t.trackingStartedAt ?? undefined,
    milestone: t.milestone ?? undefined,
    subtasks: t.subtasks?.map((s: any) => ({
      id: s.id,
      name: s.name,
      completed: s.completed,
    })),
    dependencies: t.dependencies?.map((d: any) => d.dependsOnTask?.name).filter(Boolean),
  }));

  const completedTasks = prismaDossier.tasks
    .filter((t: any) => t.completed)
    .map((t: any) => t.name);

  const activityHistory: ActivityEntry[] = prismaDossier.activityEntries.map((a: any) => ({
    id: a.id,
    type: a.type as ActivityEntry['type'],
    description: a.description,
    timestamp: a.timestamp.toISOString(),
    taskName: a.taskName ?? undefined,
    oldValue: a.oldValue ?? undefined,
    newValue: a.newValue ?? undefined,
    batchCount: a.batchCount ?? undefined,
  }));

  const chatHistory: ChatMessageData[] = prismaDossier.chatMessages.map((c: any) => {
    const content = parseChatContent(c.content);
    return {
      id: c.id,
      role: c.role as 'user' | 'ai',
      content,
      timestamp: c.timestamp,
      messageType: c.messageType as ChatMessageData['messageType'],
    };
  });

  return {
    id: prismaDossier.id,
    title: prismaDossier.title,
    situation: prismaDossier.situation,
    main_goal: prismaDossier.mainGoal,
    phase: validatePhase(prismaDossier.phase),
    progress: prismaDossier.progress,
    lastActivity: prismaDossier.lastActivity,
    createdAt: formatCreatedAt(prismaDossier.createdAt),
    tasks,
    completedTasks,
    activityHistory,
    chatHistory,
    characterProfile: prismaDossier.characterProfile ? JSON.parse(prismaDossier.characterProfile) : undefined,
    progressionState: prismaDossier.progressionState ? JSON.parse(prismaDossier.progressionState) : undefined,
    narrative: prismaDossier.narrative ? JSON.parse(prismaDossier.narrative) : undefined,
    systemPlan: prismaDossier.systemPlan ? JSON.parse(prismaDossier.systemPlan) : undefined,
    executionPlan: prismaDossier.executionPlan ? JSON.parse(prismaDossier.executionPlan) : undefined,
  };
}

function parseChatContent(content: string): string | { summary: string; next_step: string; suggested_tasks: string[] } {
  try {
    const parsed = JSON.parse(content);
    if (typeof parsed === 'object' && parsed !== null) {
      return {
        summary: parsed.summary || '',
        next_step: parsed.next_step || '',
        suggested_tasks: parsed.suggested_tasks || [],
      };
    }
  } catch {
    // Not JSON, return as string
  }
  return content;
}

// ============================================
// PUBLIC API (preserving original interface)
// ============================================

export async function getAllDossiers(): Promise<MockDossier[]> {
  const prismaDossiers = await prisma.dossier.findMany({
    include: {
      tasks: {
        include: {
          subtasks: true,
          dependencies: {
            include: {
              dependsOnTask: true,
            },
          },
        },
      },
      activityEntries: {
        orderBy: {
          timestamp: 'desc',
        },
      },
      chatMessages: {
        orderBy: {
          timestamp: 'asc',
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return filterVisibleDossiers(prismaDossiers.map(convertPrismaDossierToMockDossier));
}

export async function getCompletedDossiers(
  limit = 3,
  activeDossier?: { title: string; main_goal: string }
): Promise<Array<{ id: string; title: string; main_goal: string; relevanceScore?: number; outcomeSummary?: string; taskPatterns?: string[] }>> {
  // Fetch completed dossiers with task and activity data for outcome derivation
  const prismaDossiers = await prisma.dossier.findMany({
    where: { phase: 'Completed' },
    select: {
      id: true,
      title: true,
      mainGoal: true,
      updatedAt: true,
      lastActivity: true,
      tasks: {
        select: {
          name: true,
          completed: true,
          actualTime: true,
          priority: true,
          notes: true,
        },
        orderBy: { completedAt: 'desc' },
        take: 10, // Limit to most relevant recent tasks
      },
      activityEntries: {
        where: {
          type: { in: ['task_completed', 'milestone_reached', 'phase_advanced', 'completed'] },
        },
        orderBy: { timestamp: 'desc' },
        take: 3,
        select: {
          type: true,
          description: true,
          taskName: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
    take: 20, // Fetch more to allow for relevance filtering
  });

  const sanitized = filterVisibleDossiers(prismaDossiers);

  // If no active dossier for comparison, return latest N with outcome summaries
  if (!activeDossier) {
    return sanitized.slice(0, limit).map((d) => ({
      id: d.id,
      title: d.title,
      main_goal: d.mainGoal,
      outcomeSummary: deriveOutcomeSummary(d),
      taskPatterns: extractTaskPatterns(d.tasks),
    }));
  }

  // Score dossiers by relevance to active dossier
  const scoredDossiers = sanitized.map((d) => {
    const score = calculateRelevanceScore(
      { title: activeDossier.title, mainGoal: activeDossier.main_goal },
      { title: d.title, mainGoal: d.mainGoal }
    );
    return {
      id: d.id,
      title: d.title,
      main_goal: d.mainGoal,
      relevanceScore: score,
      outcomeSummary: deriveOutcomeSummary(d),
      taskPatterns: extractTaskPatterns(d.tasks),
    };
  });

  // Sort by relevance score (descending) and take top N
  const topDossiers = scoredDossiers
    .sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0))
    .slice(0, limit);

  return topDossiers;
}

/**
 * Extract representative task patterns from completed dossier tasks.
 * Returns a small set of task names that might serve as precedents.
 */
export function extractTaskPatterns(tasks: Array<{ name: string; completed: boolean; priority: string | null }>): string[] {
  if (tasks.length === 0) return [];

  // Prioritize: completed high-priority tasks, then any completed tasks, then high-priority incomplete
  const representativeTasks = tasks
    .filter((t) => t.name && t.name.length > 0)
    .slice(0, 5) // Limit to avoid noise
    .map((t) => t.name);

  return [...new Set(representativeTasks)]; // Deduplicate
}

/**
 * Derive a concise outcome summary from completed dossier data.
 * Focuses on practical precedent value: completion stats + key achievements.
 */
export function deriveOutcomeSummary(dossier: {
  tasks: Array<{ completed: boolean; actualTime: number; priority: string | null }>;
  lastActivity: string;
  activityEntries: Array<{ type: string; description: string }>;
}): string {
  const totalTasks = dossier.tasks.length;
  const completedTasks = dossier.tasks.filter((t) => t.completed).length;
  const totalTimeMinutes = dossier.tasks.reduce((sum, t) => sum + (t.actualTime || 0), 0);

  // Build summary parts
  const parts: string[] = [];

  // Task completion stats
  if (totalTasks > 0) {
    parts.push(`${completedTasks}/${totalTasks} tasks completed`);
  }

  // Time invested (if tracked)
  if (totalTimeMinutes > 0) {
    const hours = Math.floor(totalTimeMinutes / 60);
    const mins = totalTimeMinutes % 60;
    const timeStr = hours > 0 ? `${hours}h${mins > 0 ? ` ${mins}m` : ''}` : `${mins}m`;
    parts.push(`${timeStr} invested`);
  }

  // Key outcome from activity entries
  const keyOutcome = dossier.activityEntries.find((e) =>
    e.type === 'completed' || e.type === 'milestone_reached'
  );
  if (keyOutcome) {
    // Truncate long descriptions
    const desc = keyOutcome.description.length > 60
      ? keyOutcome.description.slice(0, 57) + '...'
      : keyOutcome.description;
    parts.push(`Outcome: ${desc}`);
  } else if (dossier.lastActivity && dossier.lastActivity !== 'Dossier created') {
    // Fall back to last activity if meaningful
    const activity = dossier.lastActivity.length > 60
      ? dossier.lastActivity.slice(0, 57) + '...'
      : dossier.lastActivity;
    parts.push(`Completed: ${activity}`);
  }

  return parts.join(' • ');
}

/**
 * Calculate relevance score between two dossiers based on text similarity.
 * Uses simple keyword overlap scoring for determinism and explainability.
 * Score range: 0-100 (higher = more relevant)
 */
export function calculateRelevanceScore(
  active: { title: string; mainGoal: string },
  completed: { title: string; mainGoal: string }
): number {
  const activeText = normalizeText(`${active.title} ${active.mainGoal}`);
  const completedText = normalizeText(`${completed.title} ${completed.mainGoal}`);

  // Extract significant words (3+ characters, not common stop words)
  const activeWords = extractSignificantWords(activeText);
  const completedWords = extractSignificantWords(completedText);

  if (activeWords.length === 0 || completedWords.length === 0) {
    return 0;
  }

  // Calculate overlap
  const overlap = activeWords.filter((word) => completedWords.includes(word));

  // Score based on:
  // - 70% weighted by match ratio (how many active words appear in completed)
  // - 30% weighted by absolute match count (reward more matches)
  const matchRatio = overlap.length / activeWords.length;
  const matchCountScore = Math.min(overlap.length / 3, 1); // Cap at 3 matches for full score

  const score = matchRatio * 70 + matchCountScore * 30;

  return Math.round(score);
}

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .replace(/\s+/g, ' ')      // Normalize whitespace
    .trim();
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'this', 'that', 'have', 'has', 'had',
  'will', 'would', 'could', 'should', 'may', 'might', 'can', 'need', 'needs',
  'verify', 'test', 'new', 'one', 'two', 'three', 'first', 'second', 'all',
  'any', 'some', 'more', 'most', 'other', 'such', 'only', 'own', 'same',
  'than', 'too', 'very', 'just', 'now', 'then', 'here', 'there', 'when',
  'where', 'why', 'how', 'what', 'which', 'who', 'whom', 'whose', 'each',
  'every', 'both', 'few', 'little', 'many', 'much', 'several', 'much',
  'into', 'onto', 'upon', 'out', 'off', 'over', 'under', 'again', 'further',
  'once', 'during', 'before', 'after', 'above', 'below', 'between', 'through',
  'while', 'about', 'against', 'until', 'since', 'because', 'about',
]);

export function extractSignificantWords(text: string): string[] {
  const words = text.split(' ').filter((word) => {
    // Must be 3+ characters and not a stop word
    return word.length >= 3 && !STOP_WORDS.has(word);
  });

  // Deduplicate while preserving order
  return [...new Set(words)];
}

export async function getStoredDossierById(id: string): Promise<MockDossier | undefined> {
  const prismaDossier = await prisma.dossier.findUnique({
    where: { id },
    include: {
      tasks: {
        include: {
          subtasks: true,
          dependencies: {
            include: {
              dependsOnTask: true,
            },
          },
        },
      },
      activityEntries: {
        orderBy: {
          timestamp: 'desc',
        },
      },
      chatMessages: {
        orderBy: {
          timestamp: 'asc',
        },
      },
    },
  });

  if (!prismaDossier) return undefined;
  return convertPrismaDossierToMockDossier(prismaDossier);
}

export async function createStoredDossier(dossier: GeneratedDossier): Promise<MockDossier> {
  const now = new Date();
  const id = dossier.id ?? crypto.randomUUID();

  try {
    console.info('[dossier:create:start]', {
      id,
      dbProvider: process.env.DATABASE_URL?.split(':')[0],
      prismaSchema: process.env.PRISMA_SCHEMA,
    });

    const prismaDossier = await prisma.dossier.create({
      data: {
        id,
        title: sanitizeString(dossier.title, 'New Dossier'),
        situation: sanitizeString(dossier.situation, 'No situation provided'),
        mainGoal: sanitizeString(dossier.main_goal, 'No goal specified'),
        phase: validatePhase(dossier.phase),
        progress: 0,
        lastActivity: 'Dossier created',
        tasks: {
          create: sanitizeTasks(dossier.suggested_tasks).map((taskName, index) => ({
            name: taskName,
            priority: index === 0 ? 'high' : 'medium',
          })),
        },
        narrative: dossier.narrative ? JSON.stringify(dossier.narrative) : null,
        systemPlan: dossier.systemPlan ? JSON.stringify(dossier.systemPlan) : null,
        executionPlan: dossier.executionPlan ? JSON.stringify(dossier.executionPlan) : null,
      },
      include: {
        tasks: {
          include: {
            subtasks: true,
            dependencies: {
              include: {
                dependsOnTask: true,
              },
            },
          },
        },
        activityEntries: true,
        chatMessages: true,
      },
    });

    console.info('[dossier:create:success]', { id });
    return convertPrismaDossierToMockDossier(prismaDossier);
  } catch (error) {
    console.error('[dossier:create:error]', {
      id,
      message: (error as Error)?.message,
      dbProvider: process.env.DATABASE_URL?.split(':')[0],
      prismaSchema: process.env.PRISMA_SCHEMA,
      stack: (error as Error)?.stack,
    });
    throw error;
  }
}

export async function updateStoredDossier(
  id: string,
  updates: Partial<Omit<MockDossier, 'id' | 'createdAt'>>
): Promise<MockDossier | null> {
  const existing = await prisma.dossier.findUnique({
    where: { id },
    include: {
      tasks: true,
    },
  });

  if (!existing) {
    console.log(`[dossier:update:not_found] id:${id}`);
    return null;
  }

  // Build Prisma update data
  const updateData: any = {
    updatedAt: new Date(),
  };

  if (updates.title !== undefined) {
    updateData.title = sanitizeString(updates.title, existing.title);
  }
  if (updates.situation !== undefined) {
    updateData.situation = sanitizeString(updates.situation, existing.situation);
  }
  if (updates.main_goal !== undefined) {
    updateData.mainGoal = sanitizeString(updates.main_goal, existing.mainGoal);
  }
  if (updates.phase !== undefined) {
    updateData.phase = validatePhase(updates.phase);
  }
  if (updates.progress !== undefined) {
    updateData.progress = Math.max(0, Math.min(100, Math.round(updates.progress)));
  }
  if (updates.lastActivity !== undefined) {
    updateData.lastActivity = sanitizeString(updates.lastActivity, existing.lastActivity);
  }
  if (updates.characterProfile !== undefined) {
    updateData.characterProfile = updates.characterProfile ? JSON.stringify(updates.characterProfile) : null;
  }
  if (updates.progressionState !== undefined) {
    updateData.progressionState = updates.progressionState ? JSON.stringify(updates.progressionState) : null;
  }
  if (updates.narrative !== undefined) {
    updateData.narrative = updates.narrative ? JSON.stringify(updates.narrative) : null;
  }
  if (updates.systemPlan !== undefined) {
    updateData.systemPlan = updates.systemPlan ? JSON.stringify(updates.systemPlan) : null;
  }
  if (updates.executionPlan !== undefined) {
    updateData.executionPlan = updates.executionPlan ? JSON.stringify(updates.executionPlan) : null;
  }

  // Handle tasks update - replace all tasks
  if (updates.tasks !== undefined) {
    // Delete existing tasks (cascade deletes subtasks and dependencies)
    await prisma.task.deleteMany({
      where: { dossierId: id },
    });

    // Create new tasks
    const tasks = Array.isArray(updates.tasks) ? updates.tasks : [];
    const taskData = tasks.map((task: Task | string, index: number) => {
      const taskObj = typeof task === 'string' ? { name: task } : task;
      return {
        name: taskObj.name.slice(0, MAX_TASK_LENGTH),
        notes: taskObj.notes?.slice(0, MAX_STRING_LENGTH),
        priority: taskObj.priority,
        category: taskObj.category,
        dueDate: taskObj.dueDate,
        estimate: taskObj.estimate,
        actualTime: taskObj.actualTime,
        isTracking: taskObj.isTracking ?? false,
        trackingStartedAt: taskObj.trackingStartedAt,
        milestone: taskObj.milestone,
        completed: typeof task === 'string' 
          ? (updates.completedTasks?.includes(task) ?? false)
          : (updates.completedTasks?.includes(taskObj.name) ?? false),
        subtasks: taskObj.subtasks ? {
          create: taskObj.subtasks.map((sub) => ({
            name: sub.name.slice(0, MAX_TASK_LENGTH),
            completed: sub.completed ?? false,
          })),
        } : undefined,
      };
    });

    updateData.tasks = {
      create: taskData,
    };
  }

  // Handle activity history - append new entries
  if (updates.activityHistory !== undefined && Array.isArray(updates.activityHistory)) {
    updateData.activityEntries = {
      create: updates.activityHistory.map((entry: ActivityEntry) => ({
        type: entry.type,
        description: entry.description.slice(0, MAX_STRING_LENGTH),
        taskName: entry.taskName?.slice(0, MAX_TASK_LENGTH),
        oldValue: entry.oldValue?.slice(0, MAX_STRING_LENGTH),
        newValue: entry.newValue?.slice(0, MAX_STRING_LENGTH),
        batchCount: entry.batchCount,
        timestamp: new Date(entry.timestamp),
      })),
    };
  }

  // Handle chat history - append new messages
  if (updates.chatHistory !== undefined && Array.isArray(updates.chatHistory)) {
    updateData.chatMessages = {
      create: updates.chatHistory.map((msg: ChatMessageData) => ({
        role: msg.role,
        content: typeof msg.content === 'string' 
          ? msg.content.slice(0, MAX_STRING_LENGTH)
          : JSON.stringify(msg.content).slice(0, MAX_STRING_LENGTH),
        messageType: msg.messageType,
        timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(),
      })),
    };
  }

  const updatedPrismaDossier = await prisma.dossier.update({
    where: { id },
    data: updateData,
    include: {
      tasks: {
        include: {
          subtasks: true,
          dependencies: {
            include: {
              dependsOnTask: true,
            },
          },
        },
      },
      activityEntries: {
        orderBy: {
          timestamp: 'desc',
        },
      },
      chatMessages: {
        orderBy: {
          timestamp: 'asc',
        },
      },
    },
  });

  console.log(`[dossier:update:success] id:${id} fields:${Object.keys(updates).join(',')}`);
  return convertPrismaDossierToMockDossier(updatedPrismaDossier);
}

export async function deleteStoredDossier(id: string): Promise<boolean> {
  try {
    await prisma.dossier.delete({
      where: { id },
    });
    console.log(`[dossier:delete:success] id:${id}`);
    return true;
  } catch (error) {
    console.log(`[dossier:delete:failed] id:${id}`);
    return false;
  }
}

// ============================================
// MIGRATION: Import from legacy JSON format
// ============================================

export async function importDossierFromLegacy(legacyDossier: MockDossier): Promise<MockDossier> {
  // Check if dossier already exists
  const existing = await prisma.dossier.findUnique({
    where: { id: legacyDossier.id },
  });

  if (existing) {
    console.log(`[migration:skip] Dossier ${legacyDossier.id} already exists`);
    return convertPrismaDossierToMockDossier(existing);
  }

  // Create dossier with all related data
  const prismaDossier = await prisma.dossier.create({
    data: {
      id: legacyDossier.id,
      title: sanitizeString(legacyDossier.title, 'Untitled Dossier'),
      situation: sanitizeString(legacyDossier.situation, 'No situation provided'),
      mainGoal: sanitizeString(legacyDossier.main_goal, 'No goal specified'),
      phase: validatePhase(legacyDossier.phase),
      progress: Math.max(0, Math.min(100, legacyDossier.progress ?? 0)),
      lastActivity: sanitizeString(legacyDossier.lastActivity, 'Imported from legacy'),
      createdAt: new Date(legacyDossier.createdAt),
      characterProfile: legacyDossier.characterProfile ? JSON.stringify(legacyDossier.characterProfile) : null,
      progressionState: legacyDossier.progressionState ? JSON.stringify(legacyDossier.progressionState) : null,
      narrative: legacyDossier.narrative ? JSON.stringify(legacyDossier.narrative) : null,
      systemPlan: legacyDossier.systemPlan ? JSON.stringify(legacyDossier.systemPlan) : null,
      executionPlan: legacyDossier.executionPlan ? JSON.stringify(legacyDossier.executionPlan) : null,
      tasks: {
        create: legacyDossier.tasks?.map((task: Task | string) => {
          const taskObj = typeof task === 'string' ? { name: task } : task;
          return {
            name: taskObj.name.slice(0, MAX_TASK_LENGTH),
            notes: taskObj.notes?.slice(0, MAX_STRING_LENGTH),
            priority: taskObj.priority,
            category: taskObj.category,
            dueDate: taskObj.dueDate,
            estimate: taskObj.estimate,
            actualTime: taskObj.actualTime,
            isTracking: taskObj.isTracking ?? false,
            trackingStartedAt: taskObj.trackingStartedAt,
            milestone: taskObj.milestone,
            completed: legacyDossier.completedTasks?.includes(taskObj.name) ?? false,
            subtasks: taskObj.subtasks ? {
              create: taskObj.subtasks.map((sub) => ({
                name: sub.name.slice(0, MAX_TASK_LENGTH),
                completed: sub.completed ?? false,
              })),
            } : undefined,
          };
        }) ?? [],
      },
      activityEntries: {
        create: legacyDossier.activityHistory?.map((entry) => ({
          type: entry.type,
          description: entry.description.slice(0, MAX_STRING_LENGTH),
          taskName: entry.taskName?.slice(0, MAX_TASK_LENGTH),
          oldValue: entry.oldValue?.slice(0, MAX_STRING_LENGTH),
          newValue: entry.newValue?.slice(0, MAX_STRING_LENGTH),
          batchCount: entry.batchCount,
          timestamp: new Date(entry.timestamp),
        })) ?? [],
      },
      chatMessages: {
        create: legacyDossier.chatHistory?.map((msg) => ({
          role: msg.role,
          content: typeof msg.content === 'string' 
            ? msg.content.slice(0, MAX_STRING_LENGTH)
            : JSON.stringify(msg.content).slice(0, MAX_STRING_LENGTH),
          messageType: msg.messageType,
          timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(),
        })) ?? [],
      },
    },
    include: {
      tasks: {
        include: {
          subtasks: true,
          dependencies: {
            include: {
              dependsOnTask: true,
            },
          },
        },
      },
      activityEntries: true,
      chatMessages: true,
    },
  });

  console.log(`[migration:success] Dossier ${legacyDossier.id} imported`);
  return convertPrismaDossierToMockDossier(prismaDossier);
}
