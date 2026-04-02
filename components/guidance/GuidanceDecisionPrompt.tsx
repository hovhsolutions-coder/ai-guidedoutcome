import React from 'react';

interface GuidanceDecisionPromptProps {
  prompt: string;
  onPrimaryPrompt: () => void;
  onSecondaryPrompt: () => void;
}

export function GuidanceDecisionPrompt({
  prompt,
  onPrimaryPrompt,
  onSecondaryPrompt,
}: GuidanceDecisionPromptProps) {
  return (
    <div className="ui-surface-secondary space-y-4 p-5">
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
          Decision prompt
        </p>
        <p className="text-sm leading-6 text-[var(--text-secondary)]">{prompt}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={onPrimaryPrompt} className="ui-button-secondary">
          Clarify next move
        </button>
        <button onClick={onSecondaryPrompt} className="ui-button-secondary">
          Surface blind spots
        </button>
      </div>
    </div>
  );
}
