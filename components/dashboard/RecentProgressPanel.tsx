import Link from 'next/link';
import React from 'react';
import { type DossierPriorityModel } from '@/src/lib/dossiers/prioritization';

interface RecentProgressPanelProps {
  dossiers: DossierPriorityModel[];
}

export function RecentProgressPanel({ dossiers }: RecentProgressPanelProps) {
  return (
    <div className="ui-surface-primary p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
            Recent moves
          </p>
          <h3 className="text-xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">Progress to confirm</h3>
          <p className="text-sm leading-6 text-[var(--text-secondary)]">
            Quick snapshot of what changed most recently so you can close the loop or log the win.
          </p>
        </div>
        <Link
          href="/dossiers"
          className="ui-button-ghost min-h-0 px-0 py-0 text-sm font-medium text-[var(--accent-primary-strong)] hover:bg-transparent"
        >
          Review dossier queue
        </Link>
      </div>

      <div className="space-y-3">
        {dossiers.length === 0 ? (
          <p className="text-sm leading-6 text-[var(--text-secondary)]">No recent progress to show yet.</p>
        ) : (
          dossiers.map((dossier) => (
            <Link
              key={dossier.id}
              href={`/dossiers/${dossier.id}`}
              className="ui-surface-secondary ui-interactive-card block rounded-[16px] px-4 py-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-[var(--text-primary)]">{dossier.title}</p>
                <span className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  {dossier.createdAt}
                </span>
              </div>
              <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{dossier.lastActivity}</p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
