import React from 'react';
import { cn } from '@/lib/utils';
import { type GuidanceContentDensity } from '@/src/components/guidance/guidance-presentation-contracts';

interface GuidanceActionListProps {
  actions: string[];
  nextStep?: string;
  onAddAction?: (action: string) => void;
  isAdded?: (action: string) => boolean;
  density?: GuidanceContentDensity | null;
}

export function GuidanceActionList({
  actions,
  nextStep,
  onAddAction,
  isAdded = () => false,
  density = 'guided',
}: GuidanceActionListProps) {
  const visibleActions = nextStep ? [nextStep, ...actions] : actions;
  const isMinimal = density === 'minimal';

  return (
    <div className={`ui-surface-secondary border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.022)] ${isMinimal ? 'space-y-3 p-4' : 'space-y-4 p-5'}`}>
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
          Suggested actions
        </p>
      </div>

      <div className="space-y-2.5">
        {visibleActions.length === 0 ? (
          <div className="rounded-[16px] border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] px-4 py-4 text-sm text-[var(--text-secondary)]">
            No suggested actions yet. Ask for refinement to generate sharper next steps.
          </div>
        ) : (
          visibleActions.map((action, index) => {
            const added = isAdded(action);
            const isPrimary = index === 0 && nextStep;

            return (
              <div
                key={`${action}-${index}`}
                className={cn(
                  'flex items-start justify-between gap-3 rounded-[16px] border px-4 py-3 transition-all duration-200',
                  added
                    ? 'ui-success-flash border-[rgba(114,213,154,0.22)] bg-[var(--success-soft)]'
                    : isPrimary
                      ? 'ui-objective-highlight border-[rgba(94,142,242,0.22)] bg-[rgba(94,142,242,0.08)]'
                      : 'border-[var(--border-subtle)] bg-[rgba(255,255,255,0.025)]'
                )}
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span
                    className={cn(
                      'mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold',
                      added
                        ? 'bg-[rgba(114,213,154,0.18)] text-[var(--success-strong)]'
                        : isPrimary
                          ? 'bg-[var(--accent-primary-soft)] text-[var(--accent-primary-strong)]'
                          : 'bg-[rgba(255,255,255,0.08)] text-[var(--text-secondary)]'
                    )}
                  >
                    {added ? 'OK' : index + 1}
                  </span>
                  <div className="space-y-1">
                    {isPrimary && !isMinimal && (
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-primary-strong)]">
                        Next step
                      </p>
                    )}
                    <p className={cn('text-sm leading-6', added ? 'text-[var(--success-strong)]' : 'text-[var(--text-primary)]')}>
                      {action}
                    </p>
                  </div>
                </div>

                {onAddAction && (
                  <button
                    onClick={() => onAddAction(action)}
                    disabled={added}
                    className={cn(
                      'min-h-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 disabled:cursor-not-allowed',
                      added
                        ? 'bg-[rgba(114,213,154,0.12)] text-[var(--success-strong)] opacity-90'
                        : 'ui-button-ghost text-[var(--accent-primary-strong)] hover:bg-[var(--accent-primary-soft)] hover:text-[var(--text-primary)]'
                    )}
                  >
                    {added ? 'Added to queue' : 'Add task'}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
