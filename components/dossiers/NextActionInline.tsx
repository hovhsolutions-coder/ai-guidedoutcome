import React from 'react';

interface NextActionInlineProps {
  currentObjective: string;
  recommendedNextAction: string;
}

export function NextActionInline({
  currentObjective,
  recommendedNextAction,
}: NextActionInlineProps) {
  return (
    <div className="ui-objective-highlight space-y-3 rounded-[16px] border border-[rgba(94,142,242,0.18)] bg-[rgba(94,142,242,0.08)] px-4 py-4 transition-all duration-300">
      <div className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-primary-strong)]">
          Current focus
        </p>
        <p className="text-sm font-medium leading-6 text-[var(--text-primary)]">{currentObjective}</p>
      </div>
      <div className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
          Recommended next move
        </p>
        <p className="text-sm leading-6 text-[var(--text-secondary)]">{recommendedNextAction}</p>
      </div>
    </div>
  );
}
