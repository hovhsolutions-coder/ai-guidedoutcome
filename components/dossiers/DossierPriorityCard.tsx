import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface DossierPriorityCardModel {
  id: string;
  title: string;
  phase: string;
  createdAt: string;
  lastActivity: string;
  focusBadge: {
    label: string;
    tone: 'focus' | 'active' | 'watch';
  };
  currentObjective: string;
  statusLine: string;
  recommendedNextAction: string;
  progress: number;
  progressLine: string;
  blocker: {
    label: string;
    tone: 'blocker' | 'momentum' | 'steady';
  };
  isFocusNow: boolean;
  mainGoal?: string;
}

interface DossierPriorityCardProps {
  dossier: DossierPriorityCardModel;
}

export function DossierPriorityCard({ dossier }: DossierPriorityCardProps) {
  const isCompleted = dossier.phase === 'Completed';
  
  return (
    <Link href={`/dossiers/${dossier.id}`} className="h-full">
      <div
        className={cn(
          'ui-surface-primary ui-interactive-card group h-full cursor-pointer p-5 transition-all duration-200 hover:bg-[color:var(--surface-elevated)]',
          dossier.isFocusNow && 'border-[rgba(94,142,242,0.22)] shadow-[0_22px_64px_rgba(8,14,26,0.34)]',
          isCompleted && 'border-[var(--color-green)]/20 bg-[var(--color-green)]/5'
        )}
      >
        <div className="space-y-4">
          {/* Header: Phase + Title */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn(
                  'text-xs font-semibold uppercase tracking-[0.14em]',
                  dossier.phase === 'Action' && 'text-[var(--accent-primary)]',
                  dossier.phase === 'Structuring' && 'text-[var(--accent-secondary)]',
                  dossier.phase === 'Understanding' && 'text-[var(--text-secondary)]',
                  isCompleted && 'text-[var(--color-green)]'
                )}>
                  {dossier.phase}
                </span>
                {dossier.isFocusNow && (
                  <span className="ui-chip ui-chip-focus">Focus now</span>
                )}
                {isCompleted && (
                  <span className="ui-chip ui-chip-success">Completed</span>
                )}
              </div>
              <h3 className="text-lg font-semibold tracking-[-0.02em] text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent-primary-strong)] line-clamp-2">
                {dossier.title}
              </h3>
            </div>
            <div className="text-right shrink-0">
              <span className={cn(
                'text-2xl font-bold tracking-tight',
                isCompleted ? 'text-[var(--color-green)]' : 'text-[var(--text-primary)]'
              )}>
                {dossier.progress}%
              </span>
            </div>
          </div>

          {/* Progress bar with priority indicator */}
          <div className="space-y-2">
            <div className="h-1.5 w-full rounded-full bg-[rgba(255,255,255,0.07)] overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-300',
                  isCompleted 
                    ? 'bg-[var(--color-green)]' 
                    : 'bg-gradient-to-r from-[#5e8ef2] to-[#83aeff]'
                )}
                style={{ width: `${dossier.progress}%` }}
              />
            </div>
            <div className="flex items-center gap-2">
              {isCompleted ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-green)]">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-green)]" />
                  Work complete — ready for reference
                </span>
              ) : dossier.blocker.tone === 'blocker' && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent-error)]">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent-error)]" />
                  Action needed
                </span>
              )}
              {!isCompleted && dossier.blocker.tone === 'momentum' && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--success-strong)]">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--success-strong)]" />
                  Momentum
                </span>
              )}
              {!isCompleted && dossier.blocker.tone === 'steady' && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent-warning)]">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent-warning)]" />
                  Active
                </span>
              )}
            </div>
          </div>

          {/* Action/Outcome line */}
          <div className={cn(
            'rounded-[12px] border p-3',
            isCompleted
              ? 'border-[var(--color-green)]/20 bg-[var(--color-green)]/5'
              : dossier.isFocusNow 
                ? 'border-[rgba(94,142,242,0.2)] bg-[rgba(94,142,242,0.05)]' 
                : 'border-[var(--border-subtle)] bg-[rgba(255,255,255,0.02)]'
          )}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)] mb-1">
              {isCompleted ? 'Outcome achieved' : 'Next move'}
            </p>
            <p className={cn(
              'text-sm leading-relaxed',
              isCompleted 
                ? 'text-[var(--text-primary)]'
                : dossier.isFocusNow ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-secondary)]'
            )}>
              {isCompleted && dossier.mainGoal 
                ? dossier.mainGoal 
                : dossier.recommendedNextAction}
            </p>
          </div>

          {/* Footer: priority-aware */}
          <div className="border-t border-[var(--border-subtle)] pt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={cn(
                'inline-flex h-2 w-2 rounded-full',
                isCompleted && 'bg-[var(--color-green)]',
                !isCompleted && dossier.focusBadge.tone === 'focus' && 'bg-[var(--accent-primary)]',
                !isCompleted && dossier.focusBadge.tone === 'active' && 'bg-[var(--success-strong)]',
                !isCompleted && dossier.focusBadge.tone === 'watch' && 'bg-[var(--accent-warning)]'
              )} />
              <span className="text-xs text-[var(--text-muted)]">
                {isCompleted ? 'Available for reference' : dossier.focusBadge.label}
              </span>
            </div>
            <span className={cn(
              'text-xs font-semibold transition-colors',
              isCompleted 
                ? 'text-[var(--color-green)] group-hover:text-[var(--color-green)]' 
                : 'text-[var(--text-muted)] group-hover:text-[var(--accent-primary)]'
            )}>
              {isCompleted ? 'View record →' : 'Open dossier →'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
