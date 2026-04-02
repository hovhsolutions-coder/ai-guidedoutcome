import React from 'react';

interface NextStepPanelProps {
  nextStep: string;
  focusBadge: string;
  statusLine: string;
  primaryCtaLabel: string;
  onPrimaryAction: () => void;
  onReviewTasks: () => void;
}

export function NextStepPanel({
  nextStep,
  focusBadge,
  statusLine,
  primaryCtaLabel,
  onPrimaryAction,
  onReviewTasks,
}: NextStepPanelProps) {
  return (
    <div className="ui-surface-primary border border-[rgba(94,142,242,0.15)] p-5">
      <div className="space-y-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--accent-primary-soft)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--accent-primary-strong)]">
              {focusBadge}
            </span>
          </div>
          <p className="max-w-2xl text-lg font-semibold leading-7 tracking-[-0.02em] text-[var(--text-primary)]">
            {nextStep}
          </p>
          <p className="max-w-2xl text-sm leading-5 text-[var(--text-secondary)]">
            {statusLine}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={onPrimaryAction} className="ui-button-primary text-sm px-4 py-2">
            {primaryCtaLabel}
          </button>
          <button onClick={onReviewTasks} className="ui-button-secondary text-sm px-4 py-2">
            View tasks
          </button>
        </div>
      </div>
    </div>
  );
}
