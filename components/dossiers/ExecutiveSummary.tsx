'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { type Task, type ActivityEntry, type DossierPhase } from '@/lib/mockData';

interface ExecutiveSummaryProps {
  tasks: Task[];
  completedTasks: Set<string>;
  phase?: DossierPhase;
  dossierHealth: {
    status: 'healthy' | 'delayed' | 'blocked' | 'stalled';
    score: number;
    daysSinceLastActivity: number;
    stalledTasks: Task[];
    blockedTasks: Task[];
    reason: string;
  };
  keyUnlocker: {
    task: Task | null;
    unlocksCount: number;
    unlocks: string[];
  };
  stalledTasks: Task[];
  nextBestAction: {
    message: string;
    action: string;
    urgency: 'high' | 'medium' | 'low';
  };
}

// Mode-aware section title
function getModeTitle(phase?: DossierPhase): string {
  switch (phase) {
    case 'Understanding':
      return 'Situation overview';
    case 'Structuring':
      return 'Planning overview';
    case 'Executing':
      return 'Execution summary';
    case 'Completed':
      return 'Work record';
    default:
      return 'Executive summary';
  }
}

// Mode-aware action label
function getModeActionLabel(phase?: DossierPhase): string {
  switch (phase) {
    case 'Understanding':
      return 'Clarity needed';
    case 'Structuring':
      return 'Decision needed';
    case 'Executing':
      return 'Action needed';
    case 'Completed':
      return 'Review complete';
    default:
      return 'Next action';
  }
}

export function ExecutiveSummary({
  tasks,
  completedTasks,
  phase,
  dossierHealth,
  keyUnlocker,
  stalledTasks,
  nextBestAction,
}: ExecutiveSummaryProps) {
  const activeCount = tasks.filter((t) => !completedTasks.has(t.name)).length;
  const completedCount = completedTasks.size;
  const totalCount = tasks.length;

  const healthColors = {
    healthy: 'text-[var(--color-green)] bg-[var(--color-green)]/10 border-[var(--color-green)]/30',
    delayed: 'text-[var(--accent-warning)] bg-[var(--accent-warning)]/10 border-[var(--accent-warning)]/30',
    blocked: 'text-[var(--accent-error)] bg-[var(--accent-error)]/10 border-[var(--accent-error)]/30',
    stalled: 'text-[var(--text-secondary)] bg-[var(--text-secondary)]/10 border-[var(--text-secondary)]/30',
  };

  const healthIcons = {
    healthy: '✓',
    delayed: '◷',
    blocked: '⊘',
    stalled: '◌',
  };

  const healthLabels = {
    healthy: 'On Track',
    delayed: 'Delayed',
    blocked: 'Blocked',
    stalled: 'Stalled',
  };

  return (
    <div className="ui-surface-secondary rounded-[18px] p-4 space-y-4">
      {/* Top row: Health status + Score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold',
            healthColors[dossierHealth.status]
          )}>
            {healthIcons[dossierHealth.status]}
          </span>
          <div>
            <p className={cn(
              'text-sm font-semibold',
              healthColors[dossierHealth.status].split(' ')[0]
            )}>
              {healthLabels[dossierHealth.status]}
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              {dossierHealth.reason}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-[var(--text-primary)]">
            {dossierHealth.score}
          </p>
          <p className="text-xs text-[var(--text-secondary)]">health score</p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-[rgba(255,255,255,0.03)] p-2 text-center">
          <p className="text-lg font-semibold text-[var(--text-primary)]">{activeCount}</p>
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">Open</p>
        </div>
        <div className="rounded-lg bg-[rgba(255,255,255,0.03)] p-2 text-center">
          <p className="text-lg font-semibold text-[var(--color-green)]">{completedCount}</p>
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">Done</p>
        </div>
        <div className="rounded-lg bg-[rgba(255,255,255,0.03)] p-2 text-center">
          <p className="text-lg font-semibold text-[var(--text-primary)]">{totalCount}</p>
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">Total</p>
        </div>
      </div>

      {/* Intelligence insights */}
      <div className="space-y-3">
        {/* Next action - Prominent placement first */}
        <div className={cn(
          'rounded-[14px] border p-3.5',
          nextBestAction.urgency === 'high' && 'border-[var(--accent-error)]/30 bg-[var(--accent-error)]/8',
          nextBestAction.urgency === 'medium' && 'border-[var(--accent-warning)]/30 bg-[var(--accent-warning)]/8',
          nextBestAction.urgency === 'low' && 'border-[var(--color-green)]/30 bg-[var(--color-green)]/8'
        )}>
          <div className="flex items-start gap-2.5">
            <span className={cn(
              'mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold',
              nextBestAction.urgency === 'high' && 'bg-[var(--accent-error)]/20 text-[var(--accent-error)]',
              nextBestAction.urgency === 'medium' && 'bg-[var(--accent-warning)]/20 text-[var(--accent-warning)]',
              nextBestAction.urgency === 'low' && 'bg-[var(--color-green)]/20 text-[var(--color-green)]'
            )}>
              {nextBestAction.urgency === 'high' ? '!' : nextBestAction.urgency === 'medium' ? '→' : '✓'}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">{getModeActionLabel(phase)}</p>
              <p className="mt-0.5 text-sm font-medium text-[var(--text-primary)]">
                {nextBestAction.action}
              </p>
              <p className="text-[11px] leading-4 text-[var(--text-secondary)]">
                {nextBestAction.message}
              </p>
            </div>
          </div>
        </div>

        {/* Key unlocker hint */}
        {keyUnlocker.unlocksCount > 0 && keyUnlocker.task && (
          <div className="flex items-start gap-2 rounded-lg bg-[var(--accent-primary)]/5 p-2.5">
            <span className="text-[var(--accent-primary)]">🔓</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[var(--text-primary)]">
                Complete <span className="text-[var(--accent-primary)]">{keyUnlocker.task.name}</span> to unlock {keyUnlocker.unlocksCount} task{keyUnlocker.unlocksCount > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        )}

        {/* Stalled tasks warning */}
        {stalledTasks.length > 0 && (
          <div className="flex items-start gap-2 rounded-lg bg-[var(--accent-warning)]/5 p-2.5">
            <span className="text-[var(--accent-warning)]">⏸</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[var(--text-primary)]">
                {stalledTasks.length} task{stalledTasks.length > 1 ? 's' : ''} stalled: {stalledTasks.slice(0, 2).map(t => t.name).join(', ')}
                {stalledTasks.length > 2 && ` +${stalledTasks.length - 2} more`}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
