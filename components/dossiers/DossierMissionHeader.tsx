import React from 'react';
import { type DossierPhase } from '@/lib/mockData';
import { cn } from '@/lib/utils';

interface DossierMissionHeaderProps {
  title: string;
  phase: DossierPhase;
  mission: string;
  onPhaseChange?: (phase: DossierPhase) => void;
}

const PHASE_ORDER: DossierPhase[] = ['Understanding', 'Structuring', 'Executing', 'Completed'];

function getPhaseColor(phase: DossierPhase) {
  switch (phase) {
    case 'Understanding':
      return 'ui-chip-understanding';
    case 'Structuring':
      return 'ui-chip-structuring';
    case 'Executing':
      return 'ui-chip-action';
    case 'Completed':
      return 'ui-chip-success';
    default:
      return 'ui-chip-understanding';
  }
}

// Intent-aware header labels based on phase
function getIntentHeaderLabel(phase: DossierPhase): string {
  switch (phase) {
    case 'Understanding':
      return 'Exploring the situation';
    case 'Structuring':
      return 'Planning the approach';
    case 'Executing':
      return 'Mission control';
    case 'Completed':
      return 'Work completed';
    default:
      return 'Exploring the situation';
  }
}

function getNextPhase(current: DossierPhase): DossierPhase | null {
  const currentIndex = PHASE_ORDER.indexOf(current);
  if (currentIndex === -1 || currentIndex >= PHASE_ORDER.length - 1) {
    return null;
  }
  return PHASE_ORDER[currentIndex + 1];
}

export function DossierMissionHeader({ title, phase, mission, onPhaseChange }: DossierMissionHeaderProps) {
  const nextPhase = getNextPhase(phase);
  const canAdvance = nextPhase !== null && onPhaseChange !== undefined;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className={cn(
            "text-[11px] font-semibold uppercase tracking-[0.18em]",
            phase === 'Understanding' && "text-[var(--accent-info)]",
            phase === 'Structuring' && "text-[var(--accent-warning)]",
            phase === 'Executing' && "text-[var(--text-secondary)]",
            phase === 'Completed' && "text-[var(--color-green)]"
          )}>
            {getIntentHeaderLabel(phase)}
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.045em] text-[var(--text-primary)] sm:text-4xl">
            {title}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn('ui-chip px-4 py-1.5 text-sm tracking-[0.1em]', getPhaseColor(phase))}>
            {phase}
          </span>
          {canAdvance && (
            <button
              onClick={() => onPhaseChange?.(nextPhase)}
              className="ui-button-ghost text-[11px] px-2 py-1 tracking-wide"
              title={`Move to ${nextPhase}`}
            >
              →
            </button>
          )}
        </div>
      </div>

      <p className="max-w-3xl text-base leading-7 text-[var(--text-secondary)]">{mission}</p>
    </div>
  );
}
