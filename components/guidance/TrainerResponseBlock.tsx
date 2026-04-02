import React from 'react';
import { AITrainerResponseOutput } from '@/src/lib/ai/types';

interface TrainerResponseBlockProps {
  response: AITrainerResponseOutput | null;
  error: string | null;
  isLoading: boolean;
  loadingTrainer: string | null;
  onAddAction: (action: string) => void;
}

export function TrainerResponseBlock({
  response,
  error,
  isLoading,
  loadingTrainer,
  onAddAction,
}: TrainerResponseBlockProps) {
  if (!response && !error && !isLoading) {
    return null;
  }

  return (
    <div className="ui-surface-secondary space-y-4 px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
            Trainer support
          </p>
          {response && (
            <>
              <div className="flex items-center gap-2">
                <span className="ui-chip ui-chip-accent">{response.trainer}</span>
                <span className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                  {response.focus_label}
                </span>
              </div>
              <h4 className="text-lg font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
                {response.headline}
              </h4>
            </>
          )}
          {!response && isLoading && (
            <>
              <div className="flex items-center gap-2">
                <span className="ui-chip ui-chip-accent">{loadingTrainer ?? 'trainer'}</span>
                <span className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                  Specialist read
                </span>
              </div>
              <h4 className="text-lg font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
                Loading specialist read
              </h4>
            </>
          )}
        </div>
        {response && <span className="ui-chip ui-chip-accent">{response.confidence_label}</span>}
      </div>

      {error ? (
        <p className="text-sm leading-6 text-[var(--text-secondary)]">
          The specialist read could not be loaded right now. Keep moving with the main guidance thread and try again when needed.
        </p>
      ) : null}

      {isLoading ? (
        <div className="space-y-3">
          <div className="ui-skeleton h-3 w-24" />
          <div className="ui-skeleton h-5 w-9/12" />
          <div className="ui-skeleton h-16 w-full rounded-[18px]" />
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="ui-skeleton h-12 w-full rounded-[16px]" />
            <div className="ui-skeleton h-12 w-full rounded-[16px]" />
          </div>
        </div>
      ) : null}

      {response ? (
        <>
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
              Key insight
            </p>
            <p className="text-sm leading-6 text-[var(--text-secondary)]">{response.key_insight}</p>
          </div>

          <div className="rounded-[18px] border border-[rgba(94,142,242,0.2)] bg-[rgba(94,142,242,0.06)] px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-primary-strong)]">
              Recommendation
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{response.recommendation}</p>
            <p className="mt-3 text-base font-semibold leading-7 text-[var(--text-primary)]">
              {response.next_move}
            </p>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => onAddAction(response.next_move)}
                className="ui-button-secondary min-h-0 px-4 py-2 text-[11px] uppercase tracking-[0.12em]"
              >
                Add support action
              </button>
            </div>
          </div>

          {response.caution ? (
            <div className="rounded-[18px] border border-[rgba(242,202,115,0.22)] bg-[rgba(242,202,115,0.08)] px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--warning-strong)]">
                Caution
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{response.caution}</p>
            </div>
          ) : null}

          {response.message_draft ? (
            <div className="rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                Message draft
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-primary)]">{response.message_draft}</p>
            </div>
          ) : null}

          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
              What this perspective adds
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
        </>
      ) : null}
    </div>
  );
}
