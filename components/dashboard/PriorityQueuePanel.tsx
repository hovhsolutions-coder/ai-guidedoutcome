import Link from 'next/link';
import React from 'react';
import { type DossierPriorityModel } from '@/src/lib/dossiers/prioritization';

interface PriorityQueuePanelProps {
  dossiers: DossierPriorityModel[];
}

export function PriorityQueuePanel({ dossiers }: PriorityQueuePanelProps) {
  return (
    <div className="ui-surface-primary p-6">
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
          Decision queue
        </p>
        <h3 className="text-xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">Awaiting a call</h3>
        <p className="text-sm leading-6 text-[var(--text-secondary)]">
          Open the next dossier that genuinely needs a routing or approval decision.
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {dossiers.length === 0 ? (
          <p className="text-sm leading-6 text-[var(--text-secondary)]">No dossiers need a fresh decision right now.</p>
        ) : (
          dossiers.map((dossier) => (
            <Link
              key={dossier.id}
              href={`/dossiers/${dossier.id}`}
              className="ui-surface-secondary ui-interactive-card block rounded-[16px] px-4 py-4"
            >
              <p className="text-sm font-medium text-[var(--text-primary)]">{dossier.title}</p>
              <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{dossier.recommendedNextAction}</p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
