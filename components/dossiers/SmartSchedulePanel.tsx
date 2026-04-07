'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { type ScheduleRecommendation, type ScheduledTask } from '@/src/lib/scheduling/types';

interface SmartSchedulePanelProps {
  recommendation: ScheduleRecommendation;
  onSelectTask?: (taskName: string) => void;
}

export function SmartSchedulePanel({ recommendation, onSelectTask }: SmartSchedulePanelProps) {
  const hasBlocked = recommendation.blockedTasks.length > 0;
  const hasRisks = recommendation.globalRisks.length > 0;

  return (
    <div className="ui-surface-secondary rounded-[18px] p-4 space-y-4">
      {/* Header with today's focus */}
      <TodayFocusSection focus={recommendation.todayFocus} onSelectTask={onSelectTask} />

      {/* Global risks */}
      {hasRisks && <RisksSection risks={recommendation.globalRisks} />}

      {/* Next 3 recommended tasks */}
      {recommendation.nextTasks.length > 0 && (
        <NextTasksSection tasks={recommendation.nextTasks} onSelectTask={onSelectTask} />
      )}

      {/* This week's focus */}
      <WeekFocusSection focus={recommendation.weekFocus} />

      {/* Blocked tasks summary */}
      {hasBlocked && <BlockedTasksSection tasks={recommendation.blockedTasks} />}
    </div>
  );
}

/**
 * Today's focus section
 */
function TodayFocusSection({
  focus,
  onSelectTask,
}: {
  focus: ScheduleRecommendation['todayFocus'];
  onSelectTask?: (taskName: string) => void;
}) {
  if (!focus.primaryTask) {
    return (
      <div className="rounded-lg bg-[var(--accent-warning)]/10 p-3">
        <div className="flex items-start gap-2">
          <span className="text-[var(--accent-warning)]">⏳</span>
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Everything is blocked</p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Focus on clearing dependencies so work can move again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-[var(--accent-primary)]/5 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-primary)] mb-2">
        Today's focus
      </p>

      <button
        onClick={() => onSelectTask?.(focus.primaryTask!)}
        className="w-full text-left group"
      >
        <p className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
          {focus.primaryTask}
        </p>
      </button>

      <p className="text-xs text-[var(--text-secondary)] mt-1">{focus.approach}</p>
      <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 italic">{focus.reasoning}</p>

      {focus.fallbackTasks.length > 0 && (
        <div className="mt-3 pt-2 border-t border-[var(--border-subtle)]">
          <p className="text-[10px] text-[var(--text-secondary)] mb-1.5">Then:</p>
          <div className="flex flex-wrap gap-1.5">
            {focus.fallbackTasks.map((task) => (
              <button
                key={task}
                onClick={() => onSelectTask?.(task)}
                className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.06)] text-[var(--text-secondary)] hover:bg-[var(--accent-primary)]/10 hover:text-[var(--accent-primary)] transition-colors"
              >
                {task}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Global risks section
 */
function RisksSection({ risks }: { risks: ScheduleRecommendation['globalRisks'] }) {
  return (
    <div className="space-y-2">
      {risks.map((risk, i) => (
        <div
          key={i}
          className={cn(
            'rounded-lg p-2.5',
            risk.severity === 'critical'
              ? 'bg-[var(--accent-error)]/10'
              : 'bg-[var(--accent-warning)]/10'
          )}
        >
          <div className="flex items-start gap-2">
            <span className={risk.severity === 'critical' ? 'text-[var(--accent-error)]' : 'text-[var(--accent-warning)]'}>
              {risk.severity === 'critical' ? '🚨' : '⚡'}
            </span>
            <div className="flex-1 min-w-0">
              <p className={cn(
                'text-xs font-medium',
                risk.severity === 'critical' ? 'text-[var(--accent-error)]' : 'text-[var(--text-primary)]'
              )}>
                {risk.message}
              </p>
              <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">{risk.suggestion}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Next tasks section
 */
function NextTasksSection({
  tasks,
  onSelectTask,
}: {
  tasks: ScheduledTask[];
  onSelectTask?: (taskName: string) => void;
}) {
  const orderEmojis = ['1️⃣', '2️⃣', '3️⃣'];

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
        Recommended order
      </p>

      {tasks.map((scheduledTask, index) => (
        <TaskCard
          key={scheduledTask.task.name}
          scheduledTask={scheduledTask}
          emoji={orderEmojis[index] || '•'}
          onSelect={() => onSelectTask?.(scheduledTask.task.name)}
        />
      ))}
    </div>
  );
}

/**
 * Individual task card
 */
function TaskCard({
  scheduledTask,
  emoji,
  onSelect,
}: {
  scheduledTask: ScheduledTask;
  emoji: string;
  onSelect: () => void;
}) {
  const { task, reasoning, risk } = scheduledTask;

  return (
    <button
      onClick={onSelect}
      className="w-full text-left rounded-lg bg-[rgba(255,255,255,0.03)] p-3 hover:bg-[rgba(255,255,255,0.06)] transition-colors"
    >
      <div className="flex items-start gap-2">
        <span className="text-sm">{emoji}</span>
        <div className="flex-1 min-w-0">
          {/* Task name with badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-medium text-[var(--text-primary)]">{task.name}</span>
            {task.priority === 'high' && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--accent-error)]/20 text-[var(--accent-error)]">
                high
              </span>
            )}
            {reasoning.unlocks && reasoning.unlocks.length > 0 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] flex items-center gap-0.5">
                🔓 {reasoning.unlocks.length}
              </span>
            )}
          </div>

          {/* Reasoning */}
          <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">{reasoning.explanation}</p>

          {/* Risk indicator */}
          {risk.level !== 'none' && risk.level !== 'low' && (
            <p className={cn(
              'text-[10px] mt-1',
              risk.level === 'high' ? 'text-[var(--accent-error)]' : 'text-[var(--accent-warning)]'
            )}>
              ⚠️ {risk.explanation}
            </p>
          )}

          {/* Estimate hint */}
          {task.estimate && (
            <p className="text-[10px] text-[var(--text-secondary)] mt-1">⏱ {task.estimate}</p>
          )}
        </div>
      </div>
    </button>
  );
}

/**
 * Week focus section
 */
function WeekFocusSection({ focus }: { focus: ScheduleRecommendation['weekFocus'] }) {
  const confidenceEmoji =
    focus.confidence === 'high' ? '✓' : focus.confidence === 'medium' ? '~' : '?';

  return (
    <div className="rounded-lg bg-[rgba(255,255,255,0.03)] p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
          This week
        </p>
        <span
          className={cn(
            'text-[10px] px-2 py-0.5 rounded-full',
            focus.confidence === 'high'
              ? 'bg-[var(--color-green)]/20 text-[var(--color-green)]'
              : focus.confidence === 'medium'
                ? 'bg-[var(--accent-warning)]/20 text-[var(--accent-warning)]'
                : 'bg-[var(--text-secondary)]/20 text-[var(--text-secondary)]'
          )}
          title={
            focus.confidence === 'high'
              ? 'Plan looks feasible'
              : focus.confidence === 'medium'
                ? 'Some uncertainty'
                : 'High uncertainty, stay flexible'
          }
        >
          {confidenceEmoji}
        </span>
      </div>

      {/* Objectives */}
      <div className="space-y-1">
        {focus.objectives.map((objective, i) => (
          <p key={i} className="text-xs text-[var(--text-primary)]">
            🎯 {objective}
          </p>
        ))}
      </div>

      {/* Watch for */}
      {focus.watchFor.length > 0 && (
        <div className="mt-2 pt-2 border-t border-[var(--border-subtle)]">
          <p className="text-[10px] text-[var(--text-secondary)] mb-1">Watch out:</p>
          <ul className="space-y-0.5">
            {focus.watchFor.map((watch, i) => (
              <li key={i} className="text-[10px] text-[var(--text-secondary)]">
                • {watch}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Blocked tasks summary
 */
function BlockedTasksSection({ tasks }: { tasks: ScheduledTask[] }) {
  // Group by blocker
  const byBlocker = new Map<string, string[]>();
  tasks.forEach((t) => {
    t.reasoning.blockedBy?.forEach((blocker) => {
      const blocked = byBlocker.get(blocker) || [];
      blocked.push(t.task.name);
      byBlocker.set(blocker, blocked);
    });
  });

  return (
    <div className="rounded-lg bg-[var(--text-secondary)]/5 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)] mb-2">
        Blocked ({tasks.length})
      </p>

      <p className="text-[10px] text-[var(--text-secondary)]">
        {tasks.length} task{tasks.length > 1 ? 's' : ''} waiting on dependencies
      </p>

      {byBlocker.size > 0 && (
        <div className="mt-2 space-y-1">
          {Array.from(byBlocker.entries())
            .sort(([, a], [, b]) => b.length - a.length)
            .slice(0, 2)
            .map(([blocker, blocked]) => (
              <p key={blocker} className="text-[10px] text-[var(--text-secondary)]">
                • {blocker} blocks {blocked.length} task{blocked.length > 1 ? 's' : ''}
              </p>
            ))}
        </div>
      )}
    </div>
  );
}



