import React from 'react';
import { cn } from '@/lib/utils';

interface TaskMomentumBannerProps {
  totalTasks: number;
  completedCount: number;
  message: string;
}

export function TaskMomentumBanner({
  totalTasks,
  completedCount,
  message,
}: TaskMomentumBannerProps) {
  const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
  const isComplete = progressPercent === 100 && totalTasks > 0;
  const isNearComplete = progressPercent >= 75 && progressPercent < 100;

  return (
    <div className={cn(
      'rounded-[18px] border px-4 py-4 transition-all duration-300',
      isComplete 
        ? 'border-[var(--color-green)]/40 bg-[var(--color-green)]/10' 
        : isNearComplete
          ? 'border-[var(--accent-warning)]/30 bg-[var(--accent-warning)]/5'
          : 'border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)]'
    )}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            {isComplete ? (
              <svg className="h-4 w-4 text-[var(--color-green)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : isNearComplete ? (
              <svg className="h-4 w-4 text-[var(--accent-warning)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            ) : null}
            <p className={cn(
              'text-[11px] font-semibold uppercase tracking-[0.14em]',
              isComplete ? 'text-[var(--color-green)]' : 'text-[var(--text-secondary)]'
            )}>
              {isComplete ? 'Complete' : 'Progress'}
            </p>
          </div>
          <p className={cn(
            'mt-2 text-sm leading-6',
            isComplete ? 'text-[var(--color-green)] font-medium' : 'text-[var(--text-secondary)]'
          )}>{message}</p>
        </div>
        <div className="text-right">
          <p className={cn(
            'text-2xl font-semibold tracking-[-0.03em]',
            isComplete ? 'text-[var(--color-green)]' : 'text-[var(--text-primary)]'
          )}>{progressPercent}%</p>
          <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
            {completedCount}/{totalTasks}
          </p>
        </div>
      </div>
      <div className={cn(
        'mt-4 h-2 w-full overflow-hidden rounded-full border',
        isComplete ? 'border-[var(--color-green)]/30' : 'border-[var(--border-subtle)]',
        isComplete ? 'bg-[var(--color-green)]/10' : 'bg-[rgba(255,255,255,0.05)]'
      )}>
        <div
          className={cn(
            'h-full transition-all duration-300',
            isComplete 
              ? 'bg-[var(--color-green)]' 
              : 'bg-gradient-to-r from-[#5e8ef2] to-[#83aeff]'
          )}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
