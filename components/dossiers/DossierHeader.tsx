import React from 'react';
import { MockDossier, DossierPhase } from '../../lib/mockData';
import { cn } from '../../lib/utils';

interface DossierHeaderProps {
  dossier: MockDossier;
}

export function DossierHeader({ dossier }: DossierHeaderProps) {
  const getPhaseColor = (phase: DossierPhase) => {
    switch (phase) {
      case 'Understanding':
        return 'ui-chip-understanding';
      case 'Structuring':
        return 'ui-chip-structuring';
      case 'Action':
        return 'ui-chip-action';
    }
  };

  return (
    <div className="space-y-6">
      {/* Title and Phase */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">{dossier.title}</h1>
          <p className="mt-2 max-w-2xl text-[var(--text-secondary)]">{dossier.situation}</p>
        </div>
        <span className={cn('ui-chip px-4 py-1.5 text-sm tracking-[0.1em]', getPhaseColor(dossier.phase))}>
          {dossier.phase}
        </span>
      </div>

      {/* Main Goal */}
      <div className="ui-surface-accent p-5">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-primary-strong)]">Main Goal</p>
        <p className="text-[var(--text-primary)]">{dossier.main_goal}</p>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--text-secondary)]">Overall Progress</span>
          <span className="font-semibold text-[var(--text-primary)]">{dossier.progress}%</span>
        </div>
        <div className="h-3 w-full rounded-full bg-[rgba(255,255,255,0.07)]">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-[#5e8ef2] to-[#83aeff] transition-all duration-300"
            style={{ width: `${dossier.progress}%` }}
          />
        </div>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="ui-metadata-block p-4">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-secondary)]">Created</p>
          <p className="mt-1 text-[var(--text-primary)]">{dossier.createdAt}</p>
        </div>
        <div className="ui-metadata-block p-4">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-secondary)]">Last Activity</p>
          <p className="mt-1 text-[var(--text-primary)]">{dossier.lastActivity}</p>
        </div>
      </div>
    </div>
  );
}
