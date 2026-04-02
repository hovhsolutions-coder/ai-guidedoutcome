/**
 * Smart Scheduling Engine
 * 
 * Deterministic planning with AI-supported explanation.
 * 6-step reasoning:
 * 1. Blocked tasks down
 * 2. Key unlockers up
 * 3. Due-date risk
 * 4. Priority + health combine
 * 5. Estimated effort
 * 6. Stalled items visible as risk
 */

import { type Task, type ActivityEntry } from '@/lib/mockData';
import { type ExecutionContext } from '@/src/lib/execution/execution-context';
import {
  type ScheduledTask,
  type ScheduleRecommendation,
  type ScheduleReasoning,
  type ScheduleRisk,
  type ScheduleFactor,
  type ScheduleRiskType,
  type GlobalScheduleRisk,
  type TodayFocus,
  type WeekFocus,
  type ScheduleConfig,
  DEFAULT_SCHEDULE_CONFIG,
} from './types';

/**
 * Calculate scheduling score for a task
 * Higher score = more important to do now
 */
function calculateTaskScore(
  task: Task,
  executionContext: ExecutionContext,
  completedTasks: Set<string>,
  unlockedByTask: Map<string, string[]>,
  config: ScheduleConfig
): number {
  let score = 0;

  // 1. Blocked tasks get heavily penalized (but not zero - we still track them)
  const isBlocked = task.dependencies && task.dependencies.length > 0 && completedTasks
    ? task.dependencies.some((dep) => !completedTasks.has(dep))
    : false;
  if (isBlocked) {
    score -= 1000; // Heavy penalty
  }

  // 2. Key unlocker bonus - tasks that unblock many others get boosted
  const unlocks = unlockedByTask.get(task.name) || [];
  const unlockerBonus = unlocks.length * 50 * config.unlockerWeight;
  score += unlockerBonus;

  // 3. Due-date risk
  if (task.dueDate) {
    const dueDate = new Date(task.dueDate);
    const now = new Date();
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilDue < 0) {
      // Overdue - high urgency
      score += 80 * config.dueDateWeight;
    } else if (daysUntilDue <= config.nearDueThresholdDays) {
      // Near due
      score += 60 * config.dueDateWeight;
    } else if (daysUntilDue <= 7) {
      // This week
      score += 30 * config.dueDateWeight;
    }
  }

  // 4. Priority + health weighted
  const priorityMultiplier = executionContext.health.status === 'healthy' ? 1 : 1.5;
  if (task.priority === 'high') {
    score += 40 * config.priorityWeight * priorityMultiplier;
  } else if (task.priority === 'medium') {
    score += 20 * config.priorityWeight * priorityMultiplier;
  }

  // 5. Estimated effort (small tasks get slight bonus for momentum)
  if (task.estimate) {
    const estimate = parseEstimate(task.estimate);
    if (estimate <= 15) {
      // Quick win
      score += 10 * config.effortWeight;
    } else if (estimate >= 120) {
      // Large task - slight penalty (needs planning)
      score -= 5 * config.effortWeight;
    }
  }

  // 6. Stalled is a risk flag, not a priority boost
  // (handled in risk assessment, not scoring)

  // Base score for all active tasks
  score += 10;

  return Math.round(score);
}

/**
 * Parse time estimate string to minutes
 * Supports: "30m", "1h", "1.5h", "2h 30m"
 */
function parseEstimate(estimate: string): number {
  let minutes = 0;

  // Hours
  const hourMatch = estimate.match(/(\d+\.?\d*)\s*h/i);
  if (hourMatch) {
    minutes += parseFloat(hourMatch[1]) * 60;
  }

  // Minutes
  const minMatch = estimate.match(/(\d+)\s*m/i);
  if (minMatch) {
    minutes += parseInt(minMatch[1], 10);
  }

  // Just a number - assume minutes
  if (!hourMatch && !minMatch) {
    const numMatch = estimate.match(/(\d+)/);
    if (numMatch) {
      minutes += parseInt(numMatch[1], 10);
    }
  }

  return minutes;
}

/**
 * Build reasoning for why a task is scheduled where it is
 */
function buildReasoning(
  task: Task,
  score: number,
  unlocks: string[],
  blockedBy: string[],
  isStalled: boolean,
  executionContext: ExecutionContext
): ScheduleReasoning {
  const factors: ScheduleFactor[] = [];
  let primaryFactor: ScheduleFactor = 'momentum';

  // Determine primary factor
  if (blockedBy.length > 0) {
    primaryFactor = 'blocked';
    factors.push('blocked');
  } else if (unlocks.length > 0) {
    primaryFactor = 'key-unlocker';
    factors.push('key-unlocker');
  } else if (task.dueDate) {
    const dueDate = new Date(task.dueDate);
    const now = new Date();
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilDue < 0) {
      primaryFactor = 'overdue';
      factors.push('overdue');
    } else if (daysUntilDue <= 2) {
      primaryFactor = 'near-due';
      factors.push('near-due');
    }
  }

  if (task.priority === 'high' && primaryFactor !== 'blocked') {
    if (primaryFactor === 'momentum') {
      primaryFactor = 'high-priority';
    }
    factors.push('high-priority');
  }

  if (executionContext.health.status !== 'healthy' && task.priority === 'high') {
    factors.push('health-weighted');
  }

  if (isStalled) {
    factors.push('stalled');
  }

  if (task.estimate) {
    const estimate = parseEstimate(task.estimate);
    if (estimate <= 15) {
      factors.push('small-effort');
    } else if (estimate >= 120) {
      factors.push('large-effort');
    }
  }

  // Build explanation
  let explanation = '';
  switch (primaryFactor) {
    case 'blocked':
      explanation = `Waiting on ${blockedBy.join(', ')} to complete first`;
      break;
    case 'key-unlocker':
      explanation = `Unlocks ${unlocks.length} task${unlocks.length > 1 ? 's' : ''}: ${unlocks.slice(0, 2).join(', ')}${unlocks.length > 2 ? ' and more' : ''}`;
      break;
    case 'overdue':
      explanation = `Overdue - needs immediate attention`;
      break;
    case 'near-due':
      explanation = `Due soon - approaching deadline`;
      break;
    case 'high-priority':
      explanation = `High priority task${executionContext.health.status !== 'healthy' ? ' (especially urgent given current health)' : ''}`;
      break;
    default:
      explanation = task.estimate && parseEstimate(task.estimate) <= 15
        ? 'Quick win - good for momentum'
        : 'Ready to work on';
  }

  return {
    primaryFactor,
    secondaryFactors: factors.filter((f) => f !== primaryFactor),
    explanation,
    unlocks: unlocks.length > 0 ? unlocks : undefined,
    blockedBy: blockedBy.length > 0 ? blockedBy : undefined,
  };
}

/**
 * Assess risk for a task
 */
function assessTaskRisk(
  task: Task,
  isBlocked: boolean,
  blockedBy: string[],
  isStalled: boolean,
  executionContext: ExecutionContext,
  config: ScheduleConfig
): ScheduleRisk {
  const types: ScheduleRiskType[] = [];
  let level: ScheduleRisk['level'] = 'none';
  const explanations: string[] = [];

  // Blocked risk
  if (isBlocked) {
    types.push('blocked');
    level = 'medium';
    explanations.push(`Blocked by ${blockedBy.length} task${blockedBy.length > 1 ? 's' : ''}`);
  }

  // Stalled risk
  if (isStalled) {
    types.push('stalled');
    if (level === 'none') level = 'low';
    explanations.push('No activity for 3+ days');
  }

  // Due date risks
  if (task.dueDate) {
    const dueDate = new Date(task.dueDate);
    const now = new Date();
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilDue < 0) {
      types.push('overdue');
      level = 'high';
      explanations.push('Past due date');
    } else if (daysUntilDue <= 2 && !isBlocked) {
      // Check if likely to be late
      types.push('likely-late');
      level = level === 'none' || level === 'low' ? 'medium' : level;
      explanations.push('Due soon - limited time remaining');
    }
  }

  // Too much open work
  if (executionContext.stats.active > config.maxParallelTasks * 2) {
    types.push('too-much-open-work');
    if (level === 'none') level = 'low';
  }

  return {
    level,
    types,
    explanation: explanations.join('; ') || 'No significant risks',
  };
}

/**
 * Calculate confidence in scheduling recommendation
 */
function calculateConfidence(
  task: Task,
  isBlocked: boolean,
  hasEstimate: boolean,
  stalledRatio: number
): 'high' | 'medium' | 'low' {
  // Low confidence if blocked (can't predict when blockers clear)
  if (isBlocked) return 'low';

  // Medium confidence if many stalled tasks (pattern unclear)
  if (stalledRatio > 0.3) return 'medium';

  // Medium confidence if no estimate
  if (!hasEstimate) return 'medium';

  return 'high';
}

/**
 * Build global schedule risks
 */
function buildGlobalRisks(
  scheduledTasks: ScheduledTask[],
  executionContext: ExecutionContext,
  config: ScheduleConfig
): GlobalScheduleRisk[] {
  const risks: GlobalScheduleRisk[] = [];

  // Check for too much open work
  if (executionContext.stats.active > config.maxParallelTasks * 2) {
    risks.push({
      type: 'too-much-open-work',
      severity: 'warning',
      message: `High workload: ${executionContext.stats.active} active tasks`,
      affectedTasks: scheduledTasks.slice(0, 5).map((t) => t.task.name),
      suggestion: 'Consider completing or deprioritizing some tasks before starting new ones',
    });
  }

  // Check for overdue tasks
  const overdueTasks = scheduledTasks.filter((t) =>
    t.risk.types.includes('overdue')
  );
  if (overdueTasks.length > 0) {
    risks.push({
      type: 'overdue',
      severity: 'critical',
      message: `${overdueTasks.length} task${overdueTasks.length > 1 ? 's' : ''} overdue`,
      affectedTasks: overdueTasks.map((t) => t.task.name),
      suggestion: overdueTasks.length === 1
        ? `Complete "${overdueTasks[0].task.name}" as soon as possible`
        : 'Complete overdue tasks before starting new work',
    });
  }

  // Check for stalled tasks
  if (executionContext.stats.stalled > 0) {
    const stalledTaskNames = executionContext.stalledTasks
      .slice(0, 3)
      .map((t) => t.name);
    risks.push({
      type: 'stalled',
      severity: 'warning',
      message: `${executionContext.stats.stalled} task${executionContext.stats.stalled > 1 ? 's' : ''} with no recent activity`,
      affectedTasks: stalledTaskNames,
      suggestion: 'Review stalled tasks - either complete, deprioritize, or schedule specific time',
    });
  }

  // Check for blocked cascade (many tasks waiting on few)
  const blockedTasks = scheduledTasks.filter((t) => t.risk.types.includes('blocked'));
  if (blockedTasks.length > 3) {
    // Find common blockers
    const blockerCounts = new Map<string, number>();
    blockedTasks.forEach((t) => {
      t.reasoning.blockedBy?.forEach((blocker) => {
        blockerCounts.set(blocker, (blockerCounts.get(blocker) || 0) + 1);
      });
    });

    const commonBlockers = Array.from(blockerCounts.entries())
      .filter(([, count]) => count > 1)
      .sort(([, a], [, b]) => b - a);

    if (commonBlockers.length > 0) {
      const [topBlocker, count] = commonBlockers[0];
      risks.push({
        type: 'dependency-breaks',
        severity: 'critical',
        message: `${count} tasks blocked by "${topBlocker}"`,
        affectedTasks: blockedTasks.filter((t) => t.reasoning.blockedBy?.includes(topBlocker)).map((t) => t.task.name),
        suggestion: `Prioritize completing "${topBlocker}" to unblock ${count} tasks`,
      });
    }
  }

  return risks;
}

/**
 * Build today's focus recommendation
 */
function buildTodayFocus(
  nextTasks: ScheduledTask[],
  executionContext: ExecutionContext
): TodayFocus {
  const unblockedTasks = nextTasks.filter((t) => !t.risk.types.includes('blocked'));

  if (unblockedTasks.length === 0) {
    // Everything blocked - suggest working on blockers
    const blockers = new Set<string>();
    nextTasks.forEach((t) => {
      t.reasoning.blockedBy?.forEach((b) => blockers.add(b));
    });

    return {
      primaryTask: blockers.size > 0 ? Array.from(blockers)[0] : null,
      fallbackTasks: [],
      approach: 'Focus on unblocking work',
      reasoning: 'Multiple tasks are blocked. Completing blocker tasks will enable progress.',
    };
  }

  const primary = unblockedTasks[0];
  const fallbacks = unblockedTasks.slice(1, 3).map((t) => t.task.name);

  let approach = 'Direct execution';
  if (primary.reasoning.primaryFactor === 'key-unlocker') {
    approach = 'Strategic unlock - complete this to enable other work';
  } else if (primary.reasoning.primaryFactor === 'overdue') {
    approach = 'Urgent catch-up - overdue task needs completion';
  } else if (primary.risk.types.includes('large-effort')) {
    approach = 'Deep focus block needed';
  }

  return {
    primaryTask: primary.task.name,
    fallbackTasks: fallbacks,
    approach,
    reasoning: primary.reasoning.explanation,
  };
}

/**
 * Build this week's focus recommendation
 */
function buildWeekFocus(
  scheduledTasks: ScheduledTask[],
  executionContext: ExecutionContext
): WeekFocus {
  // Target: top 5 scheduled tasks that are unblocked
  const targetTasks = scheduledTasks
    .filter((t) => !t.risk.types.includes('blocked'))
    .slice(0, 5)
    .map((t) => t.task.name);

  // Objectives based on health
  const objectives: string[] = [];
  if (executionContext.health.status === 'blocked') {
    objectives.push('Unblock the critical path');
  } else if (executionContext.health.status === 'stalled') {
    objectives.push('Restore momentum on stalled work');
  } else if (executionContext.health.status === 'delayed') {
    objectives.push('Catch up on delayed tasks');
  } else {
    objectives.push('Maintain steady progress');
  }

  // Add unlocker objective if applicable
  const unlocker = executionContext.keyUnlocker;
  if (unlocker && unlocker.unlocksCount > 0) {
    objectives.push(`Complete "${unlocker.taskName}" to unlock ${unlocker.unlocksCount} tasks`);
  }

  // Watch for risks
  const watchFor: string[] = [];
  if (executionContext.stats.stalled > 0) {
    watchFor.push('Stalled tasks falling further behind');
  }
  if (executionContext.stats.blocked > 2) {
    watchFor.push('Blockers cascading');
  }
  if (executionContext.stats.overdue > 0) {
    watchFor.push('Due dates passing without completion');
  }

  // Confidence based on health and blocked ratio
  let confidence: WeekFocus['confidence'] = 'high';
  if (executionContext.health.status === 'blocked' || executionContext.health.status === 'stalled') {
    confidence = 'low';
  } else if (executionContext.stats.blocked / executionContext.stats.active > 0.5) {
    confidence = 'medium';
  }

  return {
    objectives,
    targetTasks,
    watchFor: watchFor.length > 0 ? watchFor : ['Maintain current momentum'],
    confidence,
  };
}

/**
 * Generate smart schedule recommendation
 * Main entry point for the scheduling engine
 */
export function generateScheduleRecommendation(
  tasks: Task[],
  completedTasks: Set<string>,
  executionContext: ExecutionContext,
  config: ScheduleConfig = DEFAULT_SCHEDULE_CONFIG
): ScheduleRecommendation {
  // Build reverse dependency map (task -> tasks that depend on it)
  const unlockedByTask = new Map<string, string[]>();
  tasks.forEach((task) => {
    if (task.dependencies) {
      task.dependencies.forEach((dep) => {
        const existing = unlockedByTask.get(dep) || [];
        existing.push(task.name);
        unlockedByTask.set(dep, existing);
      });
    }
  });

  // Get stalled task names for quick lookup
  const stalledTaskNames = new Set(executionContext.stalledTasks.map((t) => t.name));

  // Schedule all active tasks
  const activeTasks = tasks.filter((t) => !completedTasks.has(t.name));

  const scheduledTasks: ScheduledTask[] = activeTasks.map((task) => {
    const score = calculateTaskScore(task, executionContext, completedTasks, unlockedByTask, config);
    const unlocks = unlockedByTask.get(task.name) || [];

    const blockedBy = task.dependencies?.filter(
      (dep) => !completedTasks.has(dep)
    ) || [];
    const isBlocked = blockedBy.length > 0;
    const isStalled = stalledTaskNames.has(task.name);

    const reasoning = buildReasoning(task, score, unlocks, blockedBy, isStalled, executionContext);
    const risk = assessTaskRisk(task, isBlocked, blockedBy, isStalled, executionContext, config);
    const confidence = calculateConfidence(task, isBlocked, !!task.estimate, executionContext.stats.stalled / executionContext.stats.active);

    return {
      task,
      order: 0, // Will be set after sorting
      score,
      reasoning,
      risk,
      confidence,
    };
  });

  // Sort by score (descending)
  scheduledTasks.sort((a, b) => b.score - a.score);

  // Assign order after sorting
  scheduledTasks.forEach((t, i) => {
    t.order = i;
  });

  // Split into categories
  const blockedTasks = scheduledTasks.filter((t) => t.risk.types.includes('blocked'));
  const unblockedTasks = scheduledTasks.filter((t) => !t.risk.types.includes('blocked'));

  const nextTasks = unblockedTasks.slice(0, 3);
  const queuedTasks = unblockedTasks.slice(3);

  // Build global risks
  const globalRisks = buildGlobalRisks(scheduledTasks, executionContext, config);

  // Build focus recommendations
  const todayFocus = buildTodayFocus(nextTasks, executionContext);
  const weekFocus = buildWeekFocus(scheduledTasks, executionContext);

  return {
    nextTasks,
    queuedTasks,
    blockedTasks,
    globalRisks,
    todayFocus,
    weekFocus,
    generatedAt: new Date().toISOString(),
    version: '1.0.0',
  };
}

export { type ScheduleConfig, DEFAULT_SCHEDULE_CONFIG, type ScheduleRecommendation };
