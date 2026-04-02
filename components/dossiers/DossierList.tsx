import React from 'react';
import { DossierPriorityCard } from './DossierPriorityCard';
import { type MockDossier } from '../../lib/mockData';
import { prioritizeDossiers } from '@/src/lib/dossiers/prioritization';

interface DossierListProps {
  dossiers: MockDossier[];
}

export function DossierList({ dossiers }: DossierListProps) {
  const prioritizedDossiers = prioritizeDossiers(dossiers)
    .map((dossier, index) => ({ ...dossier, isFocusNow: index === 0 }));

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
          Priority stack
        </p>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">Dossier queue</h1>
        <p className="text-lg font-medium text-[var(--text-secondary)]">
          Ordered by operational priority: open the first card to stay on the current move, or pull the next one when ready.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {prioritizedDossiers.map((dossier) => (
          <div key={dossier.id} className={dossier.isFocusNow ? 'lg:col-span-2' : ''}>
            <DossierPriorityCard dossier={dossier} />
          </div>
        ))}
      </div>

      {dossiers.length === 0 && (
        <div className="ui-surface-primary py-12 text-center">
          <p className="text-[var(--text-secondary)]">No dossiers yet. Create the first dossier to start the control center.</p>
        </div>
      )}
    </div>
  );
}
