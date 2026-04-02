import React from 'react';
import { cn } from '@/lib/utils';

interface CompletedTaskGroupProps {
  tasks: string[];
  isAllComplete?: boolean;
  onReviewComplete?: () => void;
}

export function CompletedTaskGroup({ tasks, isAllComplete, onReviewComplete }: CompletedTaskGroupProps) {
  const hasCompletedTasks = tasks.length > 0;
  
  return (
    <div className={cn(
      'space-y-4 p-5 transition-all',
      hasCompletedTasks ? 'ui-surface-secondary border border-[var(--color-green)]/30 bg-[var(--color-green)]/5' : 'ui-surface-secondary'
    )}>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-[var(--color-green)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-green)]">
            {isAllComplete ? 'All Tasks Complete' : 'Completed Momentum'}
          </p>
        </div>
        <p className="text-sm leading-6 text-[var(--text-secondary)]">
          {hasCompletedTasks 
            ? `${tasks.length} task${tasks.length === 1 ? '' : 's'} finished. This record shows what you have accomplished.`
            : 'Completed work stays visible here as proof of traction, not as clutter.'}
        </p>
        
        {/* Reflection prompt for completed work */}
        {hasCompletedTasks && (
          <div className="mt-3 p-2.5 rounded-lg bg-[var(--color-green)]/10 border border-[var(--color-green)]/20">
            <p className="text-xs text-[var(--color-green)] leading-relaxed">
              {isAllComplete 
                ? 'Everything planned is now done. Take a moment to acknowledge this achievement before moving forward.'
                : 'Each completed task represents forward motion. Use this momentum to tackle what remains.'}
            </p>
          </div>
        )}
        
        {/* Continuity hint for future work */}
        {hasCompletedTasks && isAllComplete && (
          <p className="text-xs text-[var(--text-tertiary)] italic mt-2">
            This completed work forms the foundation for what comes next.
          </p>
        )}
      </div>

      <div className="space-y-2">
        {tasks.map((task, index) => (
          <div
            key={`${task}-${index}`}
            className="ui-success-flash flex items-start gap-3 rounded-[16px] border border-[rgba(114,213,154,0.2)] bg-[var(--success-soft)] px-4 py-3 transition-all duration-300"
          >
            <span className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(114,213,154,0.18)] text-[11px] font-semibold text-[var(--success-strong)]">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <p className="text-sm leading-6 text-[var(--success-strong)] line-through">{task}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
