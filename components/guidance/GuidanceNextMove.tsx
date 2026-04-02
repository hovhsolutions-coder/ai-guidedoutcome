import React from 'react';
import { type DossierPhase } from '@/lib/mockData';
import { cn } from '@/lib/utils';

interface GuidanceNextMoveProps {
  nextStep: string;
  focusBadge: string;
  statusLine: string;
  primaryLabel: string;
  phase?: DossierPhase;
  onPrimaryAction: () => void;
  onReviewTasks: () => void;
}

// Intent-aware labels based on phase
function getIntentLabels(phase?: DossierPhase) {
  switch (phase) {
    case 'Understanding':
      return {
        objectiveLabel: 'Clarity target',
        nextMoveLabel: 'Key question to resolve',
        taskQueueLabel: 'Explore situation',
      };
    case 'Structuring':
      return {
        objectiveLabel: 'Decision focus',
        nextMoveLabel: 'Path to decide',
        taskQueueLabel: 'Review options',
      };
    case 'Executing':
      return {
        objectiveLabel: 'Action target',
        nextMoveLabel: 'Next step to take',
        taskQueueLabel: 'View task queue',
      };
    case 'Completed':
      return {
        objectiveLabel: 'Outcome achieved',
        nextMoveLabel: 'What was accomplished',
        taskQueueLabel: 'Review completed work',
      };
    default:
      return {
        objectiveLabel: 'Current objective',
        nextMoveLabel: 'Recommended next move',
        taskQueueLabel: 'Open task queue',
      };
  }
}

export function GuidanceNextMove({
  nextStep,
  focusBadge,
  statusLine,
  primaryLabel,
  phase,
  onPrimaryAction,
  onReviewTasks,
}: GuidanceNextMoveProps) {
  const labels = getIntentLabels(phase);
  
  return (
    <div className="ui-surface-primary relative overflow-hidden border border-[rgba(94,142,242,0.22)] bg-[linear-gradient(135deg,rgba(94,142,242,0.18),rgba(10,13,18,0.92)_55%)] p-5 shadow-[0_18px_52px_rgba(6,10,18,0.32)]">
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(131,174,255,0.7),transparent)]" />
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className={cn(
              "text-[11px] font-semibold uppercase tracking-[0.16em]",
              phase === 'Understanding' && "text-[var(--accent-info)]",
              phase === 'Structuring' && "text-[var(--accent-warning)]",
              phase === 'Executing' && "text-[var(--accent-primary-strong)]",
              phase === 'Completed' && "text-[var(--color-green)]",
              !phase && "text-[var(--accent-primary-strong)]"
            )}>
              {labels.objectiveLabel}
            </p>
            <span className="rounded-full bg-[var(--accent-primary-soft)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-primary-strong)]">
              {focusBadge}
            </span>
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
            {labels.nextMoveLabel}
          </p>
          <p className="text-lg font-semibold leading-8 tracking-[-0.03em] text-[var(--text-primary)]">
            {nextStep}
          </p>
          <p className="text-sm leading-6 text-[var(--text-secondary)]">
            {statusLine}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button onClick={onPrimaryAction} className="ui-button-primary">
            {primaryLabel}
          </button>
          <button onClick={onReviewTasks} className="ui-button-secondary">
            {labels.taskQueueLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
