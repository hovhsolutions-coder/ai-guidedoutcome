'use client';

import { GeneratedDossier } from '@/src/types/ai';
import { CoachProfile } from '@/src/lib/coaches/catalog';
import { cn } from '../../lib/utils';

interface DossierGeneratedPreviewProps {
  dossier: GeneratedDossier;
  onPrimaryAction: () => void | Promise<void>;
  primaryActionLabel: string;
  actionHint: string;
  onSecondaryAction?: (() => void | Promise<void>) | null;
  secondaryActionLabel?: string | null;
  statusNote?: {
    tone: 'success' | 'warning';
    title: string;
    description: string;
  } | null;
  isOpening?: boolean;
  coach?: CoachProfile | null;
}

export function DossierGeneratedPreview({
  dossier,
  onPrimaryAction,
  primaryActionLabel,
  actionHint,
  onSecondaryAction = null,
  secondaryActionLabel = null,
  statusNote = null,
  isOpening = false,
  coach = null,
}: DossierGeneratedPreviewProps) {
  return (
    <div className="space-y-6">
      <div className="ui-surface-primary space-y-6 p-8">
        <div className="text-center">
          <div className="mb-4 inline-flex">
            <span className="ui-chip ui-chip-accent">Draft ready</span>
          </div>
          <h2 className="mb-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
            Review the draft
          </h2>
          <p className="mx-auto max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            Check the title, goal, and first tasks before opening the dossier.
          </p>
        </div>

        {statusNote && (
          <div
            className={cn(
              'rounded-[16px] border px-5 py-4 text-left',
              statusNote.tone === 'success'
                ? 'border-[rgba(114,213,154,0.2)] bg-[var(--success-soft)]'
                : 'border-[rgba(242,202,115,0.2)] bg-[var(--warning-soft)]'
            )}
          >
            <p
              className={cn(
                'text-[11px] font-semibold uppercase tracking-[0.16em]',
                statusNote.tone === 'success' ? 'text-[var(--success-strong)]' : 'text-[var(--warning-strong)]'
              )}
            >
              {statusNote.title}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--text-primary)]">{statusNote.description}</p>
          </div>
        )}

        {coach && (
          <div className="ui-surface-secondary border border-[rgba(109,156,255,0.24)] p-5">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-primary-strong)]">
                Your Coach
              </p>
              <h3 className="text-xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">{coach.name}</h3>
              <p className="text-sm leading-6 text-[var(--text-secondary)]">{coach.tagline}</p>
              <p className="text-sm text-[var(--text-primary)]">
                <span className="font-semibold">First support:</span> {coach.firstStep}
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="ui-surface-secondary p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">Title</p>
            <p className="mt-2 text-base font-medium text-[var(--text-primary)]">{dossier.title}</p>
          </div>

          <div className="ui-surface-secondary p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">Starting Phase</p>
            <div className="mt-2">
              <span className="ui-chip ui-chip-understanding">{dossier.phase}</span>
            </div>
          </div>
        </div>

        <div className="ui-surface-secondary space-y-3 p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">Situation</p>
          <p className="text-sm leading-6 text-[var(--text-primary)]">{dossier.situation}</p>
        </div>

        <div className="ui-surface-accent space-y-3 p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-primary-strong)]">Main Goal</p>
          <p className="text-sm leading-6 text-[var(--text-primary)]">{dossier.main_goal}</p>
        </div>

        <div className="ui-surface-secondary space-y-4 p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">Suggested Tasks</p>

          {dossier.suggested_tasks.length > 0 ? (
            <ul className="space-y-2">
              {dossier.suggested_tasks.map((task, index) => (
                <li key={index} className="ui-surface-primary flex items-start gap-3 px-4 py-3">
                  <span className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent-primary-soft)] text-xs font-semibold text-[var(--accent-primary-strong)]">
                    {index + 1}
                  </span>
                  <span className="text-sm text-[var(--text-primary)]">{task}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="ui-surface-primary px-4 py-5">
              <p className="text-sm text-[var(--text-secondary)]">No suggested tasks yet.</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Continue into the dossier to add the first move.</p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <button onClick={() => void onPrimaryAction()} disabled={isOpening} className="ui-button-primary w-full sm:flex-1">
              {primaryActionLabel}
            </button>
            {onSecondaryAction && secondaryActionLabel && (
              <button
                onClick={() => void onSecondaryAction()}
                disabled={isOpening}
                className="ui-button-secondary w-full sm:flex-1"
              >
                {secondaryActionLabel}
              </button>
            )}
          </div>
          <p className="text-center text-xs text-[var(--text-muted)]">
            {actionHint}
          </p>
        </div>
      </div>
    </div>
  );
}
