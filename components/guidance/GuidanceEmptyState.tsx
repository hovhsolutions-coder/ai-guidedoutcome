import React from 'react';

interface GuidanceEmptyStateProps {
  onPrompt: (prompt: string) => void;
}

export function GuidanceEmptyState({ onPrompt }: GuidanceEmptyStateProps) {
  return (
    <div className="ui-surface-secondary flex h-full flex-col items-center justify-center space-y-5 px-6 py-10 text-center">
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
          Guidance engine
        </p>
        <h3 className="text-xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
          Guidance will appear here
        </h3>
        <p className="max-w-md text-sm leading-6 text-[var(--text-secondary)]">
          Ask for the next move, refine the direction, or surface the main risk so execution becomes easier to trust.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <button onClick={() => onPrompt('What should I do next?')} className="ui-button-secondary">
          Clarify focus
        </button>
        <button onClick={() => onPrompt('Break this down into steps.')} className="ui-button-secondary">
          Refine next move
        </button>
        <button onClick={() => onPrompt('What am I missing?')} className="ui-button-secondary">
          Surface risks
        </button>
      </div>
    </div>
  );
}
