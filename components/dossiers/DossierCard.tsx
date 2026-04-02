import React from 'react';
import Link from 'next/link';
import { MockDossier } from '../../lib/mockData';
import { cn } from '../../lib/utils';

interface DossierCardProps {
  dossier: MockDossier;
}

export function DossierCard({ dossier }: DossierCardProps) {
  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'Understanding':
        return 'ui-chip-understanding';
      case 'Structuring':
        return 'ui-chip-structuring';
      case 'Action':
        return 'ui-chip-action';
      default:
        return '';
    }
  };

  return (
    <Link href={`/dossiers/${dossier.id}`}>
      <div className="ui-surface-primary group h-full cursor-pointer p-6 transition-all duration-200 hover:border-[var(--border-strong)] hover:bg-[color:var(--surface-elevated)] hover:shadow-[var(--shadow-ambient)]">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-semibold tracking-[-0.025em] text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent-primary-strong)]">
              {dossier.title}
            </h3>
            <span className={cn('ui-chip', getPhaseColor(dossier.phase))}>
              {dossier.phase}
            </span>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Progress</span>
              <span className="font-medium text-[var(--text-primary)]">{dossier.progress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-[rgba(255,255,255,0.07)]">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-[#5e8ef2] to-[#83aeff] transition-all duration-300"
                style={{ width: `${dossier.progress}%` }}
              />
            </div>
          </div>

          {/* Last Activity */}
          <div className="border-t border-[var(--border-subtle)] pt-2">
            <p className="text-sm text-[var(--text-secondary)]">
              <span className="font-medium text-[var(--text-primary)]">Last activity:</span> {dossier.lastActivity}
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Created {dossier.createdAt}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
