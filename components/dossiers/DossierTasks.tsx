import React from 'react';
import { cn } from '../../lib/utils';

interface TaskListProps {
  tasks: string[];
  completedTasks?: Set<string>;
  onToggleTask?: (task: string, completed: boolean) => void;
  phase?: string;
}

export function TaskList({ tasks, completedTasks = new Set(), onToggleTask, phase = 'Understanding' }: TaskListProps) {
  const handleToggleTask = (task: string) => {
    const isCurrentlyCompleted = completedTasks.has(task);
    onToggleTask?.(task, !isCurrentlyCompleted);
  };

  const progress = completedTasks.size;
  const total = tasks.length;
  const progressPercent = total > 0 ? (progress / total) * 100 : 0;

  const getProgressMeaning = (phaseName: string, completedCount: number, totalCount: number): string => {
    const completionPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    if (phaseName === 'Understanding') {
      if (completionPercent < 30) return 'You are building the foundation';
      if (completionPercent < 70) return 'You are gathering critical insights';
      return 'You are entering execution phase';
    } else if (phaseName === 'Structuring') {
      if (completionPercent < 30) return 'You are organizing your approach';
      if (completionPercent < 70) return 'You are creating actionable frameworks';
      return 'You are entering execution phase';
    }

    if (completionPercent < 30) return 'You are beginning execution';
    if (completionPercent < 70) return 'You are making progress toward completion';
    return 'You are close to completion';
  };

  const progressMeaning = total > 0 ? getProgressMeaning(phase, progress, total) : '';

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
              Execution
            </p>
            <h3 className="text-xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">Tasks</h3>
          </div>
          {total > 0 && (
            <span className="ui-chip ui-chip-accent">
              {progress}/{total}
            </span>
          )}
        </div>
        {total > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-secondary)]">
              <span className="font-semibold text-[var(--accent-primary-strong)]">{progress}</span>
              <span className="text-[var(--text-muted)]"> / {total} completed</span>
            </span>
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">
              {Math.round(progressPercent)}%
            </span>
          </div>
        )}
      </div>

      {total > 0 && (
        <div className="h-2 w-full overflow-hidden rounded-full border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.06)]">
          <div
            className="h-full bg-gradient-to-r from-[#5e8ef2] to-[#83aeff] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {progressMeaning && (
        <div className="ui-surface-secondary px-4 py-3 text-center text-xs italic text-[var(--text-secondary)]">
          {progressMeaning}
        </div>
      )}

      <div className="space-y-2">
        {tasks.length === 0 ? (
          <div className="ui-surface-secondary px-4 py-5 text-sm italic text-[var(--text-secondary)]">
            No tasks yet. Ask the AI for suggestions or add them manually.
          </div>
        ) : (
          tasks.map((task, index) => {
            const isCompleted = completedTasks.has(task);
            return (
              <button
                key={index}
                onClick={() => handleToggleTask(task)}
                className={cn(
                  'flex w-full items-start rounded-[16px] border p-3 text-left transition-all',
                  isCompleted
                    ? 'border-[rgba(114,213,154,0.2)] bg-[var(--success-soft)]'
                    : 'ui-surface-secondary hover:border-[var(--border-strong)]'
                )}
              >
                <div
                  className={cn(
                    'mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border text-[10px] font-bold transition-colors',
                    isCompleted
                      ? 'border-[var(--success-strong)] bg-[var(--success-strong)] text-[#0b1a12]'
                      : 'border-[var(--border-strong)] text-transparent'
                  )}
                >
                  {isCompleted ? '✓' : '·'}
                </div>

                <span
                  className={cn(
                    'ml-3 text-sm transition-colors',
                    isCompleted ? 'text-[var(--success-strong)] line-through' : 'text-[var(--text-primary)]'
                  )}
                >
                  {task}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
