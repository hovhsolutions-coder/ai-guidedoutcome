import React from 'react';
import Link from 'next/link';
import { DossierPriorityCard } from './DossierPriorityCard';
import { type MockDossier } from '../../lib/mockData';
import { prioritizeDossiers } from '@/src/lib/dossiers/prioritization';

interface DossierListProps {
  dossiers: MockDossier[];
}

export function DossierList({ dossiers }: DossierListProps) {
  const prioritizedDossiers = prioritizeDossiers(dossiers)
    .map((dossier, index) => ({ ...dossier, isFocusNow: index === 0 }));
  const hasDossiers = prioritizedDossiers.length > 0;

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

      {hasDossiers ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {prioritizedDossiers.map((dossier) => (
            <div key={dossier.id} className={dossier.isFocusNow ? 'lg:col-span-2' : ''}>
              <DossierPriorityCard dossier={dossier} />
            </div>
          ))}
        </div>
      ) : (
        <div className="ui-surface-primary border border-[var(--border-strong)] py-12 px-8 text-center space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">No dossiers yet</p>
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">Start your first dossier</h2>
          <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
            Create a real dossier to unlock the priority stack and guidance. Test and seed entries are hidden in production.
          </p>
          <div className="flex justify-center">
            <Link href="/dossiers/new" className="ui-button-primary px-6 py-3">
              Create dossier
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
