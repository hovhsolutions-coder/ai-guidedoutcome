/**
 * Progress Analytics Engine
 * 
 * Calculates velocity, health trends, stall patterns, schedule adherence, and forecast.
 * Compact insights that strengthen execution intelligence.
 */

import { type Task, type ActivityEntry } from '@/lib/mockData';
import {
  type ProgressAnalytics,
  type VelocityTrend,
  type HealthTrend,
  type StallPattern,
  type ScheduleAdherence,
  type ForecastLight,
  type WeekVelocity,
  type ForecastFactor,
  type AnalyticsConfig,
  DEFAULT_ANALYTICS_CONFIG,
} from './types';

/**
 * Calculate week identifier from date
 * Format: "2026-W13"
 */
function getWeekId(date: Date): string {
  const year = date.getFullYear();
  // Get ISO week number
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${year}-W${weekNum.toString().padStart(2, '0')}`;
}

/**
 * Calculate velocity trend from activity history
 */
function calculateVelocity(
  tasks: Task[],
  completedTasks: Set<string>,
  activityHistory: ActivityEntry[],
  config: AnalyticsConfig
): VelocityTrend {
  const now = new Date();
  const weeksAgo4 = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

  // Group completions by week
  const weekMap = new Map<string, WeekVelocity>();

  // Initialize last 4 weeks with zeros
  for (let i = 3; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const weekId = getWeekId(d);
    weekMap.set(weekId, {
      week: weekId,
      tasksCompleted: 0,
      subtasksCompleted: 0,
      daysWithActivity: 0,
    });
  }

  // Count task completions
  const completedTaskEvents = activityHistory.filter(
    (a) => a.type === 'task_completed' && new Date(a.timestamp) >= weeksAgo4
  );

  completedTaskEvents.forEach((event) => {
    const weekId = getWeekId(new Date(event.timestamp));
    const week = weekMap.get(weekId);
    if (week) {
      week.tasksCompleted++;
    }
  });

  // Count subtask completions (from subtask toggles in activity)
  const subtaskEvents = activityHistory.filter(
    (a) => a.type === 'subtask_completed' && new Date(a.timestamp) >= weeksAgo4
  );

  subtaskEvents.forEach((event) => {
    const weekId = getWeekId(new Date(event.timestamp));
    const week = weekMap.get(weekId);
    if (week) {
      week.subtasksCompleted++;
    }
  });

  // Count days with any activity
  const activityDays = new Map<string, Set<string>>();
  activityHistory
    .filter((a) => new Date(a.timestamp) >= weeksAgo4)
    .forEach((event) => {
      const weekId = getWeekId(new Date(event.timestamp));
      const day = new Date(event.timestamp).toDateString();
      if (!activityDays.has(weekId)) {
        activityDays.set(weekId, new Set());
      }
      activityDays.get(weekId)!.add(day);
    });

  activityDays.forEach((days, weekId) => {
    const week = weekMap.get(weekId);
    if (week) {
      week.daysWithActivity = days.size;
    }
  });

  const recentWeeks = Array.from(weekMap.values()).sort((a, b) =>
    a.week.localeCompare(b.week)
  );

  // Calculate current vs previous rate (last 2 weeks vs prior 2)
  const currentWeeks = recentWeeks.slice(-2);
  const previousWeeks = recentWeeks.slice(0, 2);

  const currentRate =
    currentWeeks.reduce((sum, w) => sum + w.tasksCompleted, 0) / 2;
  const previousRate =
    previousWeeks.reduce((sum, w) => sum + w.tasksCompleted, 0) / 2;

  // Determine direction
  let direction: VelocityTrend['direction'];
  if (currentRate === 0 && previousRate === 0) {
    direction = 'stalled';
  } else if (currentRate > previousRate * 1.2) {
    direction = 'accelerating';
  } else if (currentRate < previousRate * 0.8) {
    direction = 'slowing';
  } else {
    direction = 'steady';
  }

  // Human-readable summary
  let summary: string;
  if (direction === 'stalled') {
    summary = 'No activity in recent weeks';
  } else if (direction === 'accelerating') {
    summary = `Accelerating: ~${currentRate.toFixed(1)} tasks/week`;
  } else if (direction === 'slowing') {
    summary = `Slowing: ~${currentRate.toFixed(1)} tasks/week`;
  } else {
    summary = `Steady: ~${currentRate.toFixed(1)} tasks/week`;
  }

  return {
    currentRate,
    previousRate,
    direction,
    summary,
    recentWeeks,
  };
}

/**
 * Calculate health trend
 */
function calculateHealthTrend(
  currentHealth: number,
  activityHistory: ActivityEntry[],
  tasks: Task[],
  completedTasks: Set<string>,
  config: AnalyticsConfig
): HealthTrend {
  // Look at health from 7 days ago (approximate from activity patterns)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Calculate approximate health a week ago
  const weekAgoCompletions = activityHistory.filter(
    (a) =>
      a.type === 'task_completed' &&
      new Date(a.timestamp) <= weekAgo &&
      new Date(a.timestamp) >= new Date(weekAgo.getTime() - 7 * 24 * 60 * 60 * 1000)
  ).length;

  // Simple approximation: health was likely higher if more completions then
  const recentCompletions = activityHistory.filter(
    (a) =>
      a.type === 'task_completed' && new Date(a.timestamp) >= weekAgo
  ).length;

  const weekAgoHealth = Math.min(
    100,
    Math.max(0, currentHealth + (weekAgoCompletions - recentCompletions) * 5)
  );

  // Determine direction
  const healthDelta = currentHealth - weekAgoHealth;
  let direction: HealthTrend['direction'];
  if (healthDelta > 10) {
    direction = 'improving';
  } else if (healthDelta < -10) {
    direction = 'declining';
  } else {
    direction = 'steady';
  }

  // Insight
  let insight: string;
  if (direction === 'improving') {
    insight = 'Dossier health is improving - momentum is positive';
  } else if (direction === 'declining') {
    insight = 'Dossier health is declining - attention needed';
  } else {
    insight = 'Dossier health is steady';
  }

  // Risk flags
  const riskFlags: HealthTrend['riskFlags'] = [];
  if (healthDelta < -20) {
    riskFlags.push('health-declining-fast');
  } else if (healthDelta < -10) {
    riskFlags.push('health-declining');
  }

  // Check for accumulating stalls
  const recentStalls = tasks.filter((t) => {
    if (completedTasks.has(t.name)) return false;
    const taskActivities = activityHistory.filter((a) => a.taskName === t.name);
    if (taskActivities.length === 0) return true;
    const lastActivity = new Date(
      taskActivities[taskActivities.length - 1].timestamp
    );
    return (
      Date.now() - lastActivity.getTime() > config.stallThresholdDays * 24 * 60 * 60 * 1000
    );
  }).length;

  if (recentStalls > tasks.length * 0.3) {
    riskFlags.push('stall-accumulating');
  }

  return {
    current: currentHealth,
    weekAgo: weekAgoHealth,
    direction,
    insight,
    riskFlags,
  };
}

/**
 * Analyze stall patterns
 */
function analyzeStallPatterns(
  tasks: Task[],
  completedTasks: Set<string>,
  activityHistory: ActivityEntry[],
  config: AnalyticsConfig
): StallPattern[] {
  const patterns: StallPattern[] = [];

  // Get stalled tasks with their details
  const stalledTasks = tasks.filter((t) => {
    if (completedTasks.has(t.name)) return false;
    const taskActivities = activityHistory.filter((a) => a.taskName === t.name);
    const lastActivity =
      taskActivities.length > 0
        ? new Date(taskActivities[taskActivities.length - 1].timestamp)
        : new Date(0);
    return (
      Date.now() - lastActivity.getTime() >
      config.stallThresholdDays * 24 * 60 * 60 * 1000
    );
  });

  if (stalledTasks.length === 0) return patterns;

  // Pattern by category
  const categories = new Map<string, { total: number; stalled: number; days: number[] }>();

  tasks.forEach((t) => {
    if (!t.category) return;
    const cat = categories.get(t.category) || { total: 0, stalled: 0, days: [] };
    cat.total++;

    if (stalledTasks.includes(t)) {
      cat.stalled++;
      const taskActivities = activityHistory.filter((a) => a.taskName === t.name);
      const lastActivity =
        taskActivities.length > 0
          ? new Date(taskActivities[taskActivities.length - 1].timestamp)
          : new Date(0);
      const days = Math.round(
        (Date.now() - lastActivity.getTime()) / (24 * 60 * 60 * 1000)
      );
      cat.days.push(days);
    }

    categories.set(t.category, cat);
  });

  categories.forEach((data, category) => {
    if (data.stalled === 0) return;
    const avgDays = Math.round(
      data.days.reduce((a, b) => a + b, 0) / data.days.length
    );

    let insight: string;
    if (data.stalled / data.total > 0.5) {
      insight = `More than half of "${category}" is stalled - pattern detected`;
    } else if (avgDays > 7) {
      insight = `"${category}" tasks remain stalled for too long`;
    } else {
      insight = `Some "${category}" tasks are slowing down`;
    }

    patterns.push({
      category,
      totalTasks: data.total,
      stalledCount: data.stalled,
      stallRate: data.stalled / data.total,
      avgDaysStalled: avgDays,
      type: 'category',
      insight,
    });
  });

  // Pattern by priority
  const priorities = ['high', 'medium', 'low'];
  priorities.forEach((priority) => {
    const withPriority = tasks.filter(
      (t) => t.priority === priority && !completedTasks.has(t.name)
    );
    const stalledWithPriority = stalledTasks.filter((t) => t.priority === priority);

    if (stalledWithPriority.length > 0) {
      patterns.push({
        category: `${priority} priority`,
        totalTasks: withPriority.length,
        stalledCount: stalledWithPriority.length,
        stallRate: stalledWithPriority.length / Math.max(withPriority.length, 1),
        avgDaysStalled: 0,
        type: 'priority',
        insight: `${stalledWithPriority.length} ${priority} priority tasks are stalled`,
      });
    }
  });

  // Sort by stall rate
  return patterns.sort((a, b) => b.stallRate - a.stallRate).slice(0, 3);
}

/**
 * Calculate schedule adherence
 * Simple heuristic: did user complete recommended next tasks?
 */
function calculateScheduleAdherence(
  tasks: Task[],
  completedTasks: Set<string>,
  activityHistory: ActivityEntry[],
  config: AnalyticsConfig
): ScheduleAdherence {
  // Get completion events in order
  const completions = activityHistory
    .filter((a) => a.type === 'task_completed')
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  if (completions.length < config.minAdherenceCompletions) {
    return {
      adherenceRate: 0,
      completionsTracked: completions.length,
      recentTrend: 'steady',
      insight: 'Not enough data yet to detect a pattern',
    };
  }

  // Simplified adherence check:
  // If user completes tasks in generally priority order, that's good adherence
  const priorityOrder = { high: 3, medium: 2, low: 1, none: 0 };

  let adherenceCount = 0;
  let lastPriority = 4; // Start high

  completions.forEach((completion) => {
    const task = tasks.find((t) => t.name === completion.taskName);
    if (!task) return;

    const taskPriority = priorityOrder[task.priority || 'none'];

    // If this task priority is >= last completed, that's generally good adherence
    // (not jumping around randomly)
    if (taskPriority >= lastPriority - 1) {
      adherenceCount++;
    }

    lastPriority = taskPriority;
  });

  const adherenceRate = Math.round((adherenceCount / completions.length) * 100);

  // Trend (compare first half vs second half)
  const midPoint = Math.floor(completions.length / 2);
  const firstHalf = completions.slice(0, midPoint);
  const secondHalf = completions.slice(midPoint);

  const firstAdherence = firstHalf.filter((_, i) => i < adherenceCount / 2).length;
  const secondAdherence = secondHalf.filter((_, i) => i < adherenceCount / 2).length;

  let recentTrend: ScheduleAdherence['recentTrend'];
  if (secondAdherence > firstAdherence * 1.2) {
    recentTrend = 'improving';
  } else if (secondAdherence < firstAdherence * 0.8) {
    recentTrend = 'declining';
  } else {
    recentTrend = 'steady';
  }

  let insight: string;
  if (adherenceRate > 80) {
    insight = 'You are following priority well - efficient execution pattern';
  } else if (adherenceRate > 50) {
    insight = 'Sometimes deviating from priority - can be valid in context';
  } else {
    insight = 'Order often differs from recommendation - review if planning still fits';
  }

  return {
    adherenceRate,
    completionsTracked: completions.length,
    recentTrend,
    insight,
  };
}

/**
 * Calculate forecast light - simple traffic light for trajectory
 */
function calculateForecast(
  velocity: VelocityTrend,
  health: HealthTrend,
  stallPatterns: StallPattern[],
  adherence: ScheduleAdherence,
  completedTasks: Set<string>,
  totalTasks: number
): ForecastLight {
  const completionRate = totalTasks > 0 ? completedTasks.size / totalTasks : 0;

  const factors: ForecastFactor[] = [];

  // Velocity factor
  if (velocity.direction === 'accelerating') {
    factors.push({
      type: 'velocity',
      impact: 'positive',
      description: 'Velocity is increasing',
    });
  } else if (velocity.direction === 'slowing' || velocity.direction === 'stalled') {
    factors.push({
      type: 'velocity',
      impact: 'negative',
      description: velocity.direction === 'stalled' ? 'Fully stalled' : 'Velocity is decreasing',
    });
  }

  // Health factor
  if (health.direction === 'improving') {
    factors.push({
      type: 'health',
      impact: 'positive',
      description: 'Health is improving',
    });
  } else if (health.direction === 'declining') {
    factors.push({
      type: 'health',
      impact: 'negative',
      description: 'Health is declining',
    });
  }

  // Stalls factor
  if (stallPatterns.length > 0) {
    const totalStallRate =
      stallPatterns.reduce((sum, p) => sum + p.stallRate, 0) / stallPatterns.length;
    factors.push({
      type: 'stalls',
      impact: totalStallRate > 0.3 ? 'negative' : 'neutral',
      description: `${stallPatterns.length} stall patterns detected`,
    });
  }

  // Adherence factor
  if (adherence.adherenceRate > 80) {
    factors.push({
      type: 'adherence',
      impact: 'positive',
      description: 'Strong planning discipline',
    });
  } else if (adherence.adherenceRate < 40) {
    factors.push({
      type: 'adherence',
      impact: 'neutral',
      description: 'Frequent deviation from plan',
    });
  }

  // Determine status
  let status: ForecastLight['status'];
  let confidence: ForecastLight['confidence'] = 'medium';

  const negativeFactors = factors.filter((f) => f.impact === 'negative').length;
  const positiveFactors = factors.filter((f) => f.impact === 'positive').length;

  if (health.current > 70 && velocity.direction !== 'slowing' && velocity.direction !== 'stalled') {
    status = 'on-track';
    confidence = health.direction === 'improving' ? 'high' : 'medium';
  } else if (negativeFactors >= 2 || health.current < 30) {
    status = 'critical';
    confidence = 'high';
  } else if (negativeFactors === 1 || health.direction === 'declining' || velocity.direction === 'slowing') {
    status = 'increased-risk';
    confidence = 'medium';
  } else {
    status = 'slight-delay';
    confidence = 'low';
  }

  // Explanation
  const explanations: Record<ForecastLight['status'], string> = {
    'on-track': 'Strong progress - on track',
    'slight-delay': 'Slight delay but recoverable',
    'increased-risk': 'Increased risk - action recommended',
    'critical': 'Critical situation - intervention needed',
  };

  // Suggestion
  let suggestion: string;
  switch (status) {
    case 'on-track':
      suggestion = 'Keep going - protect momentum';
      break;
    case 'slight-delay':
      suggestion = 'Focus on the top 3 recommended tasks';
      break;
    case 'increased-risk':
      suggestion = 'Reprioritize - address blockers first';
      break;
    case 'critical':
      suggestion = 'Urgent: schedule focused time for this dossier or reduce scope';
      break;
  }

  return {
    status,
    confidence,
    explanation: explanations[status],
    factors,
    suggestion,
  };
}

/**
 * Generate complete progress analytics
 */
export function generateProgressAnalytics(
  tasks: Task[],
  completedTasks: Set<string>,
  activityHistory: ActivityEntry[],
  currentHealth: number,
  config: AnalyticsConfig = DEFAULT_ANALYTICS_CONFIG
): ProgressAnalytics {
  const velocity = calculateVelocity(tasks, completedTasks, activityHistory, config);
  const health = calculateHealthTrend(
    currentHealth,
    activityHistory,
    tasks,
    completedTasks,
    config
  );
  const stallPatterns = analyzeStallPatterns(tasks, completedTasks, activityHistory, config);
  const scheduleAdherence = calculateScheduleAdherence(
    tasks,
    completedTasks,
    activityHistory,
    config
  );
  const forecast = calculateForecast(
    velocity,
    health,
    stallPatterns,
    scheduleAdherence,
    completedTasks,
    tasks.length
  );

  return {
    velocity,
    health,
    stallPatterns,
    scheduleAdherence,
    forecast,
    generatedAt: new Date().toISOString(),
  };
}

export { type AnalyticsConfig, DEFAULT_ANALYTICS_CONFIG, type ProgressAnalytics };



