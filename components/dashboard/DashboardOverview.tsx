import React from 'react';
import Link from 'next/link';
import { FocusDossierCard } from '@/components/dashboard/FocusDossierCard';
import { PriorityQueuePanel } from '@/components/dashboard/PriorityQueuePanel';
import { BlockersPanel } from '@/components/dashboard/BlockersPanel';
import { MomentumPanel } from '@/components/dashboard/MomentumPanel';
import { RecentProgressPanel } from '@/components/dashboard/RecentProgressPanel';
import { DossierPriorityCard } from '@/components/dossiers/DossierPriorityCard';
import { getAllDossiers } from '@/src/lib/dossiers/store';
import { prioritizeDossiers } from '@/src/lib/dossiers/prioritization';
import { getSuggestedCoaches } from '@/src/lib/coaches/catalog';

interface DashboardOverviewProps {
  ownerUserId: string;
  ownerName: string;
}

export async function DashboardOverview({ ownerUserId, ownerName }: DashboardOverviewProps) {
  const dossiers = await getAllDossiers(ownerUserId);
  const prioritized = prioritizeDossiers(dossiers);
  const focusNow = prioritized[0] ?? null;
  const needsDecision = prioritized.slice(1, 4);
  const blocked = prioritized.filter((dossier) => dossier.blocker.tone === 'blocker').slice(0, 3);
  const momentum = prioritized.filter((dossier) => dossier.blocker.tone === 'momentum').slice(0, 3);
  const recentProgress = [...prioritized]
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 4);
  const secondaryPreview = prioritized.slice(1, 5).map((dossier) => ({ ...dossier, isFocusNow: false }));
  const starterCoaches = getSuggestedCoaches({}).slice(0, 3);
  const focusCoach = focusNow
    ? getSuggestedCoaches({ situation: focusNow.title, goal: focusNow.mainGoal ?? '' })[0]
    : null;

  if (prioritized.length === 0) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 text-center">
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
            Dashboard
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
            Start your first dossier
          </h1>
          <p className="mx-auto max-w-2xl text-base text-[var(--text-secondary)]">
            {ownerName.split(' ')[0]}, start with one clear situation and we will guide you to a fitting coach style before your draft is generated.
          </p>
        </div>

        <div className="ui-surface-secondary mx-auto max-w-3xl space-y-4 p-6 text-left">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-primary-strong)]">
            Who Helps You Here?
          </p>
          <p className="text-sm leading-6 text-[var(--text-secondary)]">
            In the intake, you will see suggested coaches for your situation and pick the one that feels right.
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            {starterCoaches.map((coach) => (
              <div key={coach.id} className="ui-surface-primary p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                  {coach.category}
                </p>
                <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{coach.name}</p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">{coach.tagline}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center pt-2">
          <Link href="/dossiers/new" className="ui-button-primary px-6 py-3">
            Start with guided intake
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-12">
      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
          Dashboard
        </p>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
          Your next clear move
        </h1>
        <p className="max-w-2xl text-lg font-medium text-[var(--text-secondary)]">
          Stay calm, keep focus, and move one meaningful step at a time.
        </p>
      </div>

      {focusCoach && (
        <div className="ui-surface-secondary border border-[rgba(109,156,255,0.22)] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-primary-strong)]">
            Active Coach
          </p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">{focusCoach.name}</h2>
              <p className="text-sm text-[var(--text-secondary)]">{focusCoach.tagline}</p>
            </div>
            <p className="text-sm text-[var(--text-primary)]">
              <span className="font-semibold">Next support:</span> {focusCoach.firstStep}
            </p>
          </div>
        </div>
      )}

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
              Queue
            </h2>
            <p className="text-sm leading-6 text-[var(--text-secondary)]">
              Already ordered by priority, ready when you are.
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
