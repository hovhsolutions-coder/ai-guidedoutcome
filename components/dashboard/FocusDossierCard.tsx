import Link from 'next/link';
import React from 'react';
import { PriorityBadge } from '@/components/dossiers/PriorityBadge';
import { type DossierPriorityModel } from '@/src/lib/dossiers/prioritization';

interface FocusDossierCardProps {
  dossier: DossierPriorityModel;
}

export function FocusDossierCard({ dossier }: FocusDossierCardProps) {
  return (
    <div className="ui-surface-primary relative overflow-hidden border border-[rgba(94,142,242,0.22)] bg-[linear-gradient(135deg,rgba(94,142,242,0.18),rgba(10,13,18,0.94)_58%)] p-7 shadow-[0_28px_80px_rgba(6,10,18,0.36)]">
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(131,174,255,0.78),transparent)]" />
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-primary-strong)]">
              Focus now
            </p>
            <h2 className="text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
              {dossier.title}
            </h2>
            <p className="max-w-2xl text-base leading-7 text-[var(--text-secondary)]">
              {dossier.statusLine}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PriorityBadge label={dossier.focusBadge.label} tone={dossier.focusBadge.tone} />
            <span className="ui-chip ui-chip-accent">{dossier.phase}</span>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[18px] border border-[rgba(94,142,242,0.18)] bg-[rgba(94,142,242,0.08)] px-5 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-primary-strong)]">
              Current objective
            </p>
            <p className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
              {dossier.currentObjective}
            </p>
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
              Recommended next move
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              {dossier.recommendedNextAction}
            </p>
          </div>

          <div className="ui-surface-secondary space-y-4 px-5 py-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                Progress signal
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
                {dossier.progress}%
              </p>
            </div>
            <div className="h-2 w-full rounded-full bg-[rgba(255,255,255,0.07)]">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-[#5e8ef2] to-[#83aeff]"
                style={{ width: `${dossier.progress}%` }}
              />
            </div>
            <p className="text-sm leading-6 text-[var(--text-secondary)]">{dossier.progressLine}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href={`/dossiers/${dossier.id}`} className="ui-button-primary">
            Open dossier
          </Link>
          <Link href="/dossiers" className="ui-button-secondary">
            Review dossier queue
          </Link>
        </div>
      </div>
    </div>
  );
}
