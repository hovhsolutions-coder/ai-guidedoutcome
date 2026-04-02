/**
 * Execution Context for AI Integration
 * 
 * This module provides a bridge between the deterministic execution layer
 * and the AI guidance system. The execution context gives the AI visibility
 * into the current state of task execution without allowing it to override
 * deterministic logic (health scores, blocker detection, etc. remain system-controlled).
 */

import { type Task, type ActivityEntry } from '@/lib/mockData';

/**
 * Compact execution context for AI consumption
 * Contains all execution intelligence needed for AI to provide contextual guidance
 */
export interface ExecutionContext {
  /** Overall dossier health (0-100) and status */
  health: {
    score: number;
    status: 'healthy' | 'delayed' | 'blocked' | 'stalled';
    reason: string;
    daysSinceLastActivity: number;
  };

  /** Task statistics */
  stats: {
    total: number;
    completed: number;
    active: number;
    stalled: number;
    blocked: number;
    overdue: number;
  };

  /** Current priority task - what should be done now */
  priorityTask: {
    name: string;
    priority: 'high' | 'medium' | 'low' | null;
    isBlocked: boolean;
    blockingDeps: string[];
    subtaskProgress: { completed: number; total: number } | null;
  } | null;

  /** Key unlocker - which task frees up the most others */
  keyUnlocker: {
    taskName: string;
    unlocksCount: number;
    unlocks: string[];
  } | null;

  /** Tasks that are stalled (no activity for 3+ days) */
  stalledTasks: Array<{
    name: string;
    daysIdle: number;
    priority: 'high' | 'medium' | 'low' | null;
  }>;

  /** Blocked tasks and what's blocking them */
  blockedTasks: Array<{
    name: string;
    blockedBy: string[];
  }>;

  /** Recent activity pattern */
  activityPattern: {
    lastActivity: string | null; // ISO date
    recentCompletions: number; // Last 7 days
    recentAdditions: number; // Last 7 days
  };

  /** Execution insights for AI interpretation */
  insights: {
    momentumDirection: 'accelerating' | 'steady' | 'slowing' | 'stalled';
    biggestRisk: string | null;
    easiestWin: string | null;
  };
}

/**
 * Generate execution context from current dossier state
 * This function extracts deterministic execution intelligence into a format
 * suitable for AI consumption.
 */
export function generateExecutionContext(
  tasks: Task[],
  completedTasks: Set<string>,
  activityHistory: ActivityEntry[],
  health: {
    score: number;
    status: 'healthy' | 'delayed' | 'blocked' | 'stalled';
    reason: string;
    daysSinceLastActivity: number;
  },
  keyUnlocker: {
    task: Task | null;
    unlocksCount: number;
    unlocks: string[];
  },
  stalledTasks: Task[]
): ExecutionContext {
  const activeTasks = tasks.filter((t) => !completedTasks.has(t.name));
  const completedCount = completedTasks.size;
  const totalCount = tasks.length;

  // Find blocked tasks with their blockers
  const blockedTasks = activeTasks
    .filter((t) => t.dependencies && t.dependencies.length > 0)
    .map((t) => ({
      name: t.name,
      blockedBy: t.dependencies!.filter((dep) => !completedTasks.has(dep)),
    }))
    .filter((t) => t.blockedBy.length > 0);

  // Find priority task (first non-blocked active task, or first blocked if all blocked)
  const priorityTaskCandidate = activeTasks.find((t) => 
    !t.dependencies?.some((dep) => !completedTasks.has(dep))
  ) || activeTasks[0];

  // Calculate overdue tasks (simplified - tasks with due dates in past)
  const now = new Date();
  const overdueTasks = activeTasks.filter((t) => {
    if (!t.dueDate) return false;
    const due = new Date(t.dueDate);
    return due < now;
  });

  // Calculate activity pattern
  const lastActivity = activityHistory.length > 0
    ? activityHistory[activityHistory.length - 1].timestamp
    : null;

  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentCompletions = activityHistory.filter(
    (a) => a.type === 'task_completed' && new Date(a.timestamp) >= sevenDaysAgo
  ).length;
  const recentAdditions = activityHistory.filter(
    (a) => a.type === 'task_added' && new Date(a.timestamp) >= sevenDaysAgo
  ).length;

  // Determine momentum direction
  let momentumDirection: ExecutionContext['insights']['momentumDirection'];
  if (health.daysSinceLastActivity > 5) {
    momentumDirection = 'stalled';
  } else if (recentCompletions >= 3) {
    momentumDirection = 'accelerating';
  } else if (recentCompletions >= 1) {
    momentumDirection = 'steady';
  } else {
    momentumDirection = 'slowing';
  }

  // Identify biggest risk
  let biggestRisk: string | null = null;
  if (blockedTasks.length > 0) {
    biggestRisk = `${blockedTasks.length} task${blockedTasks.length > 1 ? 's' : ''} blocked by dependencies`;
  } else if (stalledTasks.length > 0) {
    biggestRisk = `${stalledTasks.length} task${stalledTasks.length > 1 ? 's' : ''} stalled`;
  } else if (overdueTasks.length > 0) {
    biggestRisk = `${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}`;
  }

  // Identify easiest win (high priority task without blockers, or quick subtask)
  let easiestWin: string | null = null;
  const easyTask = activeTasks.find((t) => 
    t.priority === 'high' && 
    (!t.dependencies || t.dependencies.every((dep) => completedTasks.has(dep)))
  );
  if (easyTask) {
    easiestWin = easyTask.name;
  }

  return {
    health: {
      score: health.score,
      status: health.status,
      reason: health.reason,
      daysSinceLastActivity: health.daysSinceLastActivity,
    },
    stats: {
      total: totalCount,
      completed: completedCount,
      active: activeTasks.length,
      stalled: stalledTasks.length,
      blocked: blockedTasks.length,
      overdue: overdueTasks.length,
    },
    priorityTask: priorityTaskCandidate ? {
      name: priorityTaskCandidate.name,
      priority: priorityTaskCandidate.priority || null,
      isBlocked: priorityTaskCandidate.dependencies?.some(
        (dep) => !completedTasks.has(dep)
      ) ?? false,
      blockingDeps: priorityTaskCandidate.dependencies?.filter(
        (dep) => !completedTasks.has(dep)
      ) ?? [],
      subtaskProgress: priorityTaskCandidate.subtasks && priorityTaskCandidate.subtasks.length > 0
        ? {
            completed: priorityTaskCandidate.subtasks.filter((s) => s.completed).length,
            total: priorityTaskCandidate.subtasks.length,
          }
        : null,
    } : null,
    keyUnlocker: keyUnlocker.unlocksCount > 0 && keyUnlocker.task
      ? {
          taskName: keyUnlocker.task.name,
          unlocksCount: keyUnlocker.unlocksCount,
          unlocks: keyUnlocker.unlocks,
        }
      : null,
    stalledTasks: stalledTasks.map((t) => {
      const taskActivities = activityHistory.filter(
        (a) => a.taskName === t.name
      );
      const lastActivity = taskActivities.length > 0
        ? new Date(taskActivities[taskActivities.length - 1].timestamp)
        : new Date();
      const daysIdle = Math.round(
        (new Date().getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        name: t.name,
        daysIdle,
        priority: t.priority || null,
      };
    }),
    blockedTasks,
    activityPattern: {
      lastActivity,
      recentCompletions,
      recentAdditions,
    },
    insights: {
      momentumDirection,
      biggestRisk,
      easiestWin,
    },
  };
}

/**
 * Format execution context for AI prompt inclusion
 * Creates a compact, readable summary that can be injected into AI prompts
 */
export function formatExecutionContextForAI(context: ExecutionContext): string {
  const lines: string[] = [
    'EXECUTION CONTEXT:',
    `Health: ${context.health.status} (${context.health.score}/100) - ${context.health.reason}`,
    `Progress: ${context.stats.completed}/${context.stats.total} tasks completed, ${context.stats.active} active`,
    `Activity: ${context.insights.momentumDirection}, last activity ${context.health.daysSinceLastActivity.toFixed(1)} days ago`,
  ];

  if (context.priorityTask) {
    lines.push(`Priority Task: ${context.priorityTask.name}${context.priorityTask.isBlocked ? ' (BLOCKED)' : ''}`);
    if (context.priorityTask.blockingDeps.length > 0) {
      lines.push(`  Blocked by: ${context.priorityTask.blockingDeps.join(', ')}`);
    }
  }

  if (context.keyUnlocker) {
    lines.push(`Key Unlocker: Complete "${context.keyUnlocker.taskName}" to unlock ${context.keyUnlocker.unlocksCount} tasks`);
  }

  if (context.stalledTasks.length > 0) {
    lines.push(`Stalled: ${context.stalledTasks.map((t) => `"${t.name}" (${t.daysIdle}d)`).join(', ')}`);
  }

  if (context.blockedTasks.length > 0) {
    lines.push(`Blocked: ${context.blockedTasks.length} tasks waiting on dependencies`);
  }

  if (context.insights.biggestRisk) {
    lines.push(`Risk: ${context.insights.biggestRisk}`);
  }

  if (context.insights.easiestWin) {
    lines.push(`Easiest Win: ${context.insights.easiestWin}`);
  }

  return lines.join('\n');
}
