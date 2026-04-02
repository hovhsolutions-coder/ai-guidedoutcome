import React from 'react';
import { FocusDossierCard } from '@/components/dashboard/FocusDossierCard';
import { PriorityQueuePanel } from '@/components/dashboard/PriorityQueuePanel';
import { BlockersPanel } from '@/components/dashboard/BlockersPanel';
import { MomentumPanel } from '@/components/dashboard/MomentumPanel';
import { RecentProgressPanel } from '@/components/dashboard/RecentProgressPanel';
import { DossierPriorityCard } from '@/components/dossiers/DossierPriorityCard';
import { getAllDossiers } from '@/src/lib/dossiers/store';
import { prioritizeDossiers } from '@/src/lib/dossiers/prioritization';

export async function DashboardOverview() {
  const dossiers = await getAllDossiers();
  const prioritized = prioritizeDossiers(dossiers);
  const focusNow = prioritized[0] ?? null;
  const needsDecision = prioritized.slice(1, 4);
  const blocked = prioritized.filter((dossier) => dossier.blocker.tone === 'blocker').slice(0, 3);
  const momentum = prioritized.filter((dossier) => dossier.blocker.tone === 'momentum').slice(0, 3);
  const recentProgress = [...prioritized]
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 4);
  const secondaryPreview = prioritized.slice(1, 5).map((dossier) => ({ ...dossier, isFocusNow: false }));

  return (
    <div className="mx-auto max-w-7xl space-y-12">
      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
          Operations dashboard
        </p>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
          Today’s priority stack
        </h1>
        <p className="max-w-2xl text-lg font-medium text-[var(--text-secondary)]">
          See the active dossier to move now, what’s queued next, and the few items that actually need intervention.
        </p>
      </div>

      {focusNow && <FocusDossierCard dossier={focusNow} />}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <PriorityQueuePanel dossiers={needsDecision} />
        <BlockersPanel dossiers={blocked} />
        <MomentumPanel dossiers={momentum} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="ui-surface-primary p-6">
          <div className="mb-5 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
              Continue next
            </p>
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
              Secondary dossier queue
            </h2>
            <p className="text-sm leading-6 text-[var(--text-secondary)]">
              These dossiers are already ordered by priority, so opening one feels like continuing the same focus thread instead of starting over.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {secondaryPreview.map((dossier) => (
              <DossierPriorityCard key={dossier.id} dossier={dossier} />
            ))}
          </div>
        </div>

        <RecentProgressPanel dossiers={recentProgress} />
      </div>
    </div>
  );
}
