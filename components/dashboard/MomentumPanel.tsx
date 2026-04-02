import Link from 'next/link';
import React from 'react';
import { type DossierPriorityModel } from '@/src/lib/dossiers/prioritization';

interface MomentumPanelProps {
  dossiers: DossierPriorityModel[];
}

export function MomentumPanel({ dossiers }: MomentumPanelProps) {
  return (
    <div className="ui-surface-primary p-6">
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--success-strong)]">
          Momentum lane
        </p>
        <h3 className="text-xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">Keep the pace</h3>
        <p className="text-sm leading-6 text-[var(--text-secondary)]">
          Stay with the dossiers already moving so they don’t stall while you clear decisions and blockers.
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {dossiers.length === 0 ? (
          <p className="text-sm leading-6 text-[var(--text-secondary)]">No strong momentum signals yet.</p>
        ) : (
          dossiers.map((dossier) => (
            <Link
              key={dossier.id}
              href={`/dossiers/${dossier.id}`}
              className="ui-interactive-card block rounded-[16px] border border-[rgba(114,213,154,0.18)] bg-[var(--success-soft)] px-4 py-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-[var(--text-primary)]">{dossier.title}</p>
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--success-strong)]">
                  {dossier.progress}%
                </span>
              </div>
              <p className="mt-1 text-sm leading-6 text-[var(--success-strong)]">{dossier.progressLine}</p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
