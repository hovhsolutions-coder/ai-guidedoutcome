import React from 'react';
import { AITrainerId } from '@/src/lib/ai/types';

interface RecommendedTrainerStripProps {
  orderedTrainers: AITrainerId[];
  topTrainer: AITrainerId;
  confidenceLabel: 'high' | 'medium' | 'guarded';
  rationaleSummary: string;
  activeTrainer: AITrainerId | null;
  loadingTrainer: AITrainerId | null;
  onSelectTrainer: (trainer: AITrainerId) => void;
}

const TRAINERS: Array<{ id: AITrainerId; label: string; description: string }> = [
  {
    id: 'strategy',
    label: 'Strategy',
    description: 'Sharpen direction',
  },
  {
    id: 'execution',
    label: 'Execution',
    description: 'Operationalize the move',
  },
  {
    id: 'risk',
    label: 'Risk',
    description: 'Protect the mission',
  },
  {
    id: 'communication',
    label: 'Communication',
    description: 'Shape the message',
  },
];

export function RecommendedTrainerStrip({
  orderedTrainers,
  topTrainer,
  confidenceLabel,
  rationaleSummary,
  activeTrainer,
  loadingTrainer,
  onSelectTrainer,
}: RecommendedTrainerStripProps) {
  const visibleTrainers = orderTrainers(orderedTrainers);

  return (
    <div className="ui-surface-secondary space-y-4 px-5 py-4">
      <div className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
          Specialist perspectives
        </p>
        <p className="text-sm leading-6 text-[var(--text-secondary)]">
          Call a focused secondary read when the mission needs sharper direction, tighter execution, or a cleaner risk check.
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="ui-chip">{formatConfidenceLabel(confidenceLabel)} confidence</span>
          <p className="text-xs leading-5 text-[var(--text-secondary)]">{rationaleSummary}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {visibleTrainers.map((trainer, index) => {
          const isActive = activeTrainer === trainer.id;
          const isLoading = loadingTrainer === trainer.id;
          const isRecommended = index < 2;

          return (
            <button
              key={trainer.id}
              type="button"
              onClick={() => onSelectTrainer(trainer.id)}
              disabled={loadingTrainer !== null}
              className={[
                'ui-button-secondary min-h-0 rounded-full px-4 py-2 text-left transition-all duration-200',
                isActive ? 'ui-objective-highlight border-[rgba(94,142,242,0.28)] bg-[rgba(94,142,242,0.08)]' : '',
                loadingTrainer !== null ? 'opacity-80' : '',
              ].join(' ')}
            >
              <div className="flex items-center gap-2">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)]">
                  {isLoading ? `${trainer.label}...` : trainer.label}
                </span>
                {isRecommended ? (
                  <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--accent-primary-strong)]">
                    {trainer.id === topTrainer ? 'Best fit' : 'Recommended'}
                  </span>
                ) : null}
              </div>
              <span className="block text-xs text-[var(--text-secondary)]">{trainer.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function orderTrainers(order: AITrainerId[]) {
  return order
    .map((id) => TRAINERS.find((trainer) => trainer.id === id))
    .filter((trainer): trainer is (typeof TRAINERS)[number] => trainer !== undefined);
}

function formatConfidenceLabel(confidenceLabel: RecommendedTrainerStripProps['confidenceLabel']) {
  return confidenceLabel.charAt(0).toUpperCase() + confidenceLabel.slice(1);
}
