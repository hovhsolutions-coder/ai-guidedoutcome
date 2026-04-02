'use client';

import {
  type GuidanceContentDensity,
  type GuidanceMicrocopyIntent,
} from '@/src/components/guidance/guidance-presentation-contracts';
import { type AITrainerId, type AITrainerResponseOutput } from '@/src/lib/ai/types';

interface GuidanceTrainerResponseBlockProps {
  response: AITrainerResponseOutput | null;
  error: string | null;
  loadingTrainer: AITrainerId | null;
  density?: GuidanceContentDensity | null;
  intent?: GuidanceMicrocopyIntent | null;
}

export function GuidanceTrainerResponseBlock({
  response,
  error,
  loadingTrainer,
  density = 'guided',
  intent = 'deepen',
}: GuidanceTrainerResponseBlockProps) {
  if (!response && !error && !loadingTrainer) {
    return null;
  }

  const isMinimal = density === 'minimal';
  const isExpanded = density === 'expanded';
  const loadingLabel = intent === 'deepen'
    ? `Loading ${loadingTrainer} trainer...`
    : `Preparing ${loadingTrainer} trainer...`;
  const errorCopy = intent === 'deepen'
    ? 'The specialist read could not be loaded right now. Your main guidance read is still intact.'
    : 'The specialist layer could not load right now, but the current guidance direction is still safe to continue from.';
  const recommendationLabel = intent === 'deepen' ? 'What this changes' : 'Recommendation';
  const recommendationCopy = intent === 'deepen'
    ? response?.recommendation
    : response?.recommendation ?? null;
  const whatThisAddsLabel = intent === 'deepen' ? 'What this adds' : 'Support points';

  return (
    <div className="ui-surface-primary overflow-hidden border-[rgba(109,156,255,0.14)] shadow-[0_10px_24px_rgba(5,12,22,0.1)]">
      <div className="border-b border-[var(--border-subtle)] px-5 py-5 sm:px-6">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
            Specialist continuation
          </p>
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
            Trainer read
          </h2>
        </div>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        {loadingTrainer ? (
          <div className="ui-surface-secondary space-y-4 border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.022)] px-5 py-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {loadingLabel}
              </span>
              {!isMinimal ? (
                <span className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  Specialist read
                </span>
              ) : null}
            </div>
            <div className="space-y-2">
              <div className="ui-skeleton h-3 w-24" />
              <div className="ui-skeleton h-5 w-9/12" />
              <div className="ui-skeleton h-16 w-full rounded-[18px]" />
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-[16px] border border-[rgba(242,202,115,0.16)] bg-[var(--warning-soft)] px-4 py-3">
            <p className="text-sm leading-6 text-[var(--text-primary)]">
              {errorCopy}
            </p>
          </div>
        ) : null}

        {response ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="ui-chip ui-chip-accent">{response.trainer}</span>
              <span className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                {response.focus_label}
              </span>
              <span className="ui-chip">{response.confidence_label}</span>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
                {response.headline}
              </h3>
              {!isMinimal ? (
                <p className="text-sm leading-6 text-[var(--text-secondary)]">{response.key_insight}</p>
              ) : null}
            </div>

            <div className="rounded-[18px] border border-[rgba(94,142,242,0.18)] bg-[rgba(94,142,242,0.055)] px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-primary-strong)]">
                {recommendationLabel}
              </p>
              {!isMinimal && recommendationCopy ? (
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{recommendationCopy}</p>
              ) : null}
              <p className="mt-3 text-base font-semibold leading-7 text-[var(--text-primary)]">
                {response.next_move}
              </p>
            </div>

            {response.caution && !isMinimal ? (
              <div className="rounded-[18px] border border-[rgba(242,202,115,0.18)] bg-[rgba(242,202,115,0.07)] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--warning-strong)]">
                  Caution
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{response.caution}</p>
              </div>
            ) : null}

            {response.message_draft && isExpanded ? (
              <div className="rounded-[18px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.025)] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                  Message draft
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-primary)]">{response.message_draft}</p>
              </div>
            ) : null}

            {isExpanded ? (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                  {whatThisAddsLabel}
                </p>
                <div className="space-y-2">
                  {response.support_points.map((point) => (
                    <div
                      key={point}
                      className="rounded-[16px] border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm leading-6 text-[var(--text-secondary)]"
                    >
                      {point}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
