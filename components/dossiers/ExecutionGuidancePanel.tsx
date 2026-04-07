'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { type ExecutionContext } from '@/src/lib/execution/execution-context';
import { type ScheduleRecommendation } from '@/src/lib/scheduling/types';
import { type ProgressAnalytics } from '@/src/lib/analytics/types';

interface ExecutionGuidancePanelProps {
  executionContext: ExecutionContext;
  scheduleRecommendation: ScheduleRecommendation;
  progressAnalytics: ProgressAnalytics;
  onFocusTask?: (taskName: string) => void;
  onViewBlocker?: (taskName: string) => void;
  onCreateSubtasks?: (taskName: string) => void;
  onRescheduleWeek?: () => void;
}

/**
 * Execution Guidance Panel
 * 
 * Compact, contextual AI guidance during task execution.
 * NOT a chat interface - max 3 blocks with actionable advice.
 * 
 * Structure:
 * 1. Now important - what needs attention now
 * 2. Watch out - risks or blockers to be aware of
 * 3. Recommended step - concrete next action
 */
export function ExecutionGuidancePanel({
  executionContext,
  scheduleRecommendation,
  progressAnalytics,
  onFocusTask,
  onViewBlocker,
  onCreateSubtasks,
  onRescheduleWeek,
}: ExecutionGuidancePanelProps) {
  // Generate guidance items based on current state
  const guidance = React.useMemo(() => {
    return generateGuidance(executionContext, scheduleRecommendation, progressAnalytics);
  }, [executionContext, scheduleRecommendation, progressAnalytics]);

  if (!guidance.nowImportant && !guidance.watchOut && !guidance.recommendedStep) {
    return null;
  }

  return (
    <div className="ui-surface-primary rounded-[18px] p-4 space-y-3 border border-[var(--accent-primary)]/20">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-subtle)]">
        <span className="text-[var(--accent-primary)]">💡</span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-primary)]">
          Guidance
        </span>
      </div>

      {/* Now Important */}
      {guidance.nowImportant && (
        <NowImportantBlock item={guidance.nowImportant} onFocusTask={onFocusTask} />
      )}

      {/* Watch Out */}
      {guidance.watchOut && (
        <WatchOutBlock item={guidance.watchOut} onViewBlocker={onViewBlocker} onRescheduleWeek={onRescheduleWeek} />
      )}

      {/* Recommended Step */}
      {guidance.recommendedStep && (
        <RecommendedStepBlock 
          item={guidance.recommendedStep} 
          onFocusTask={onFocusTask}
          onCreateSubtasks={onCreateSubtasks}
        />
      )}
    </div>
  );
}

// ============== GUIDANCE GENERATION ==============

interface GuidanceItem {
  type: 'blocker' | 'unlocker' | 'stall' | 'risk' | 'priority' | 'action';
  title: string;
  message: string;
  taskName?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface GuidanceSet {
  nowImportant?: GuidanceItem;
  watchOut?: GuidanceItem;
  recommendedStep?: GuidanceItem;
}

function generateGuidance(
  context: ExecutionContext,
  schedule: ScheduleRecommendation,
  analytics: ProgressAnalytics
): GuidanceSet {
  const guidance: GuidanceSet = {};

  // ===== NOW IMPORTANT =====
  // Priority 1: Critical blockers affecting multiple tasks
  if (context.keyUnlocker && context.keyUnlocker.unlocksCount > 0) {
    guidance.nowImportant = {
      type: 'unlocker',
      title: 'Priority: key unlocker task',
      message: `"${context.keyUnlocker.taskName}" blocks ${context.keyUnlocker.unlocksCount} other tasks. Finishing this first creates the most momentum.`,
      taskName: context.keyUnlocker.taskName,
    };
  }
  // Priority 2: Overdue tasks
  else if (context.stats.overdue > 0) {
    const overdue = schedule.nextTasks.find(t => t.risk.types.includes('overdue'));
    if (overdue) {
      guidance.nowImportant = {
        type: 'priority',
        title: 'Urgent: overdue task',
        message: `"${overdue.task.name}" is overdue. Completing this first reduces risk.`,
        taskName: overdue.task.name,
      };
    }
  }
  // Priority 3: Stalled high-priority tasks
  else if (context.stalledTasks.length > 0) {
    const stalledHigh = context.stalledTasks.find(t => t.priority === 'high');
    if (stalledHigh) {
      guidance.nowImportant = {
        type: 'stall',
        title: 'Attention needed: stalled task',
        message: `"${stalledHigh.name}" has been stalled for ${stalledHigh.daysIdle} days and is high priority.`,
        taskName: stalledHigh.name,
      };
    }
  }

  // ===== WATCH OUT =====
  // Risk signals from analytics
  if (analytics.forecast.status === 'critical' || analytics.forecast.status === 'increased-risk') {
    guidance.watchOut = {
      type: 'risk',
      title: analytics.forecast.status === 'critical' ? 'Critical: dossier is stalling' : 'Watch out: increased risk',
      message: analytics.forecast.explanation,
    };
  }
  // Blocker cascade
  else if (context.stats.blocked > 3) {
    guidance.watchOut = {
      type: 'blocker',
      title: 'Blockers are stacking',
      message: `${context.stats.blocked} tasks are blocked. Review dependencies that need to be cleared first.`,
    };
  }
  // Health declining
  else if (analytics.health.direction === 'declining' && analytics.health.riskFlags.length > 0) {
    guidance.watchOut = {
      type: 'risk',
      title: 'Health is declining',
      message: analytics.health.insight,
    };
  }

  // ===== RECOMMENDED STEP =====
  // Based on schedule recommendation
  if (schedule.todayFocus.primaryTask) {
    const isBlocked = schedule.todayFocus.primaryTask && 
      schedule.blockedTasks.some(b => b.task.name === schedule.todayFocus.primaryTask);
    
    if (!isBlocked) {
      guidance.recommendedStep = {
        type: 'action',
        title: 'Next step',
        message: schedule.todayFocus.approach,
        taskName: schedule.todayFocus.primaryTask,
      };
    }
  }
  // Fallback: first recommended task
  else if (schedule.nextTasks.length > 0 && !guidance.nowImportant) {
    const first = schedule.nextTasks[0];
    guidance.recommendedStep = {
      type: 'action',
      title: 'Start here',
      message: first.reasoning.explanation,
      taskName: first.task.name,
    };
  }

  return guidance;
}

// ============== UI BLOCKS ==============

function NowImportantBlock({ 
  item, 
  onFocusTask 
}: { 
  item: GuidanceItem; 
  onFocusTask?: (taskName: string) => void;
}) {
  const icons = {
    blocker: '🔓',
    unlocker: '🗝️',
    stall: '⏸️',
    risk: '⚠️',
    priority: '🔴',
    action: '👉',
  };

  return (
    <div className="rounded-lg bg-[var(--accent-primary)]/10 p-3">
      <div className="flex items-start gap-2">
        <span className="text-lg">{icons[item.type]}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--accent-primary)]">
            Now important
          </p>
          <p className="text-xs font-medium text-[var(--text-primary)] mt-0.5">{item.title}</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">{item.message}</p>
          
          {item.taskName && onFocusTask && (
            <button
              onClick={() => onFocusTask(item.taskName!)}
              className="mt-2 text-[10px] px-3 py-1.5 rounded-full bg-[var(--accent-primary)] text-white font-medium hover:bg-[var(--accent-primary)]/90 transition-colors"
            >
              Mark as focus
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function WatchOutBlock({ 
  item, 
  onViewBlocker,
  onRescheduleWeek 
}: { 
  item: GuidanceItem;
  onViewBlocker?: (taskName: string) => void;
  onRescheduleWeek?: () => void;
}) {
  const icons = {
    blocker: '🚧',
    unlocker: '💡',
    stall: '⏱️',
    risk: '⚡',
    priority: '❗',
    action: '📋',
  };

  const getAction = () => {
    if (item.type === 'blocker' && onViewBlocker) {
      return {
        label: 'Review blockers',
        onClick: () => onViewBlocker(item.taskName || ''),
      };
    }
    if (item.type === 'risk' && onRescheduleWeek) {
      return {
        label: 'Replan week',
        onClick: onRescheduleWeek,
      };
    }
    return undefined;
  };

  const action = getAction();

  return (
    <div className="rounded-lg bg-[var(--accent-warning)]/10 p-3">
      <div className="flex items-start gap-2">
        <span className="text-lg">{icons[item.type]}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--accent-warning)]">
            Watch out
          </p>
          <p className="text-xs font-medium text-[var(--text-primary)] mt-0.5">{item.title}</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">{item.message}</p>
          
          {action && (
            <button
              onClick={action.onClick}
              className="mt-2 text-[10px] px-3 py-1.5 rounded-full bg-[var(--accent-warning)]/20 text-[var(--accent-warning)] font-medium hover:bg-[var(--accent-warning)]/30 transition-colors"
            >
              {action.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function RecommendedStepBlock({ 
  item, 
  onFocusTask,
  onCreateSubtasks 
}: { 
  item: GuidanceItem;
  onFocusTask?: (taskName: string) => void;
  onCreateSubtasks?: (taskName: string) => void;
}) {
  const icons = {
    blocker: '🎯',
    unlocker: '🚀',
    stall: '▶️',
    risk: '✓',
    priority: '⭐',
    action: '➡️',
  };

  return (
    <div className="rounded-lg bg-[var(--color-green)]/10 p-3">
      <div className="flex items-start gap-2">
        <span className="text-lg">{icons[item.type]}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-green)]">
            Recommended step
          </p>
          <p className="text-xs font-medium text-[var(--text-primary)] mt-0.5">
            {item.taskName || item.title}
          </p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">{item.message}</p>
          
          {item.taskName && (
            <div className="mt-2 flex flex-wrap gap-2">
              {onFocusTask && (
                <button
                  onClick={() => onFocusTask(item.taskName!)}
                  className="text-[10px] px-3 py-1.5 rounded-full bg-[var(--color-green)]/20 text-[var(--color-green)] font-medium hover:bg-[var(--color-green)]/30 transition-colors"
                >
                  Focus this
                </button>
              )}
              {onCreateSubtasks && (
                <button
                  onClick={() => onCreateSubtasks(item.taskName!)}
                  className="text-[10px] px-3 py-1.5 rounded-full bg-[rgba(255,255,255,0.06)] text-[var(--text-secondary)] font-medium hover:bg-[rgba(255,255,255,0.1)] transition-colors"
                >
                  + Subtasks
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

