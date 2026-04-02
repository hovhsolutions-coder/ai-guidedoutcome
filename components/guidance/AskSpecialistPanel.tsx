import React, { useState } from 'react';
import { AITrainerId } from '@/src/lib/ai/types';

interface AskSpecialistPanelProps {
  activeTrainer: AITrainerId | null;
  loadingTrainer: AITrainerId | null;
  onSelectTrainer: (trainer: AITrainerId) => Promise<void> | void;
}

const SPECIALISTS: Array<{
  id: AITrainerId;
  label: string;
  description: string;
}> = [
  {
    id: 'strategy',
    label: 'Strategy',
    description: 'Sharpen direction, leverage, and tradeoffs.',
  },
  {
    id: 'execution',
    label: 'Execution',
    description: 'Turn the current objective into immediate movement.',
  },
  {
    id: 'risk',
    label: 'Risk',
    description: 'Pressure-test blockers, exposure, and safeguards.',
  },
  {
    id: 'communication',
    label: 'Communication',
    description: 'Shape the message, tone, and positioning cleanly.',
  },
];

export function AskSpecialistPanel({
  activeTrainer,
  loadingTrainer,
  onSelectTrainer,
}: AskSpecialistPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (trainer: AITrainerId) => {
    setIsOpen(false);
    onSelectTrainer(trainer);
  };

  return (
    <div className="ui-surface-secondary space-y-3 px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
            Ask specialist
          </p>
          <p className="text-sm leading-6 text-[var(--text-secondary)]">
            Choose a focused specialist read when the recommended trainer actions are not specific enough.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          disabled={loadingTrainer !== null}
          className="ui-button-secondary min-h-0 px-4 py-2 text-[11px] uppercase tracking-[0.12em]"
        >
          {isOpen ? 'Close' : 'Ask specialist'}
        </button>
      </div>

      {isOpen ? (
        <div className="space-y-2 rounded-[18px] border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] p-3">
          {SPECIALISTS.map((specialist) => {
            const isActive = activeTrainer === specialist.id;
            const isLoading = loadingTrainer === specialist.id;

            return (
              <button
                key={specialist.id}
                type="button"
                onClick={() => handleSelect(specialist.id)}
                disabled={loadingTrainer !== null}
                className={[
                  'ui-interactive-card w-full rounded-[16px] border px-4 py-3 text-left transition-all duration-200',
                  isActive ? 'ui-objective-highlight border-[rgba(94,142,242,0.24)] bg-[rgba(94,142,242,0.08)]' : '',
                ].join(' ')}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-[var(--text-primary)]">
                    {isLoading ? `${specialist.label}...` : specialist.label}
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                    Specialist
                  </span>
                </div>
                <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{specialist.description}</p>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
