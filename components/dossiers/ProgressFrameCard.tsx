import React from 'react';
import { cn } from '@/lib/utils';
import { type DossierPhase } from '@/lib/mockData';

interface ProgressFrameCardProps {
  phase: DossierPhase;
  totalTasks: number;
  completedTasks: number;
  currentObjective: string;
  focusBadge: string;
  progressNarrative: string;
}

export function ProgressFrameCard({
  phase,
  totalTasks,
  completedTasks,
  progressNarrative,
}: ProgressFrameCardProps) {
  const remaining = totalTasks - completedTasks;
  const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  // Determine stage for styling
  const stage: 'startup' | 'momentum' | 'finishing' = 
    percentage === 0 ? 'startup' : 
    percentage >= 75 ? 'finishing' : 
    'momentum';

  // Mode-aware progress label
  const getProgressLabel = (phase: DossierPhase, stage: string) => {
    if (stage === 'finishing') return 'Almost done';
    switch (phase) {
      case 'Understanding':
        return 'Exploring';
      case 'Structuring':
        return 'Planning';
      case 'Executing':
        return stage === 'startup' ? 'Getting started' : 'Building momentum';
      case 'Completed':
        return 'Complete';
      default:
        return stage === 'startup' ? 'Getting started' : 'Building momentum';
    }
  };

  // Mode-aware color based on phase
  const getPhaseColor = (phase: DossierPhase) => {
    switch (phase) {
      case 'Understanding':
        return 'border-l-[var(--accent-info)] bg-[var(--accent-info)]/20 text-[var(--accent-info)]';
      case 'Structuring':
        return 'border-l-[var(--accent-warning)] bg-[var(--accent-warning)]/20 text-[var(--accent-warning)]';
      case 'Executing':
        return stage === 'startup' 
          ? 'border-l-[var(--accent-primary)] bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]'
          : 'border-l-[var(--accent-warning)] bg-[var(--accent-warning)]/20 text-[var(--accent-warning)]';
      case 'Completed':
        return 'border-l-[var(--color-green)] bg-[var(--color-green)]/20 text-[var(--color-green)]';
      default:
        return stage === 'startup'
          ? 'border-l-[var(--accent-primary)] bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]'
          : 'border-l-[var(--accent-warning)] bg-[var(--accent-warning)]/20 text-[var(--accent-warning)]';
    }
  };

  return (
    <div className={cn(
      'h-full p-4 transition-colors ui-surface-secondary border-l-4',
      getPhaseColor(phase)
    )}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
            {phase === 'Completed' ? 'Completion' : 'Progress'}
          </p>
          <span className={cn(
            'text-[10px] font-semibold uppercase tracking-[0.12em] px-2 py-0.5 rounded-full',
            getPhaseColor(phase).split(' ')[1]
          )}>
            {getProgressLabel(phase, stage)}
          </span>
        </div>
        
        <div className={cn(
          'grid gap-2',
          phase === 'Completed' ? 'grid-cols-2' : 'grid-cols-3'
        )}>
          <div className="rounded-lg bg-[rgba(255,255,255,0.03)] px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--text-secondary)]">Total</p>
            <p className="text-lg font-semibold text-[var(--text-primary)]">{totalTasks}</p>
          </div>
          <div className="rounded-lg bg-[rgba(255,255,255,0.03)] px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-green)]">Done</p>
            <p className="text-lg font-semibold text-[var(--color-green)]">{completedTasks}</p>
          </div>
          {phase !== 'Completed' && (
            <div className="rounded-lg bg-[rgba(255,255,255,0.03)] px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--accent-primary)]">Left</p>
              <p className="text-lg font-semibold text-[var(--accent-primary)]">{remaining}</p>
            </div>
          )}
        </div>

        <p className="text-sm leading-5 text-[var(--text-secondary)]">{progressNarrative}</p>
      </div>
    </div>
  );
}
