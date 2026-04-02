'use client';

interface GuidanceExecutionHandoffProps {
  handoff: {
    title: string;
    understood: string;
    nextStep: string;
    afterThis: string;
    supportingTaskCount: number;
  } | null;
}

export function GuidanceExecutionHandoff({ handoff }: GuidanceExecutionHandoffProps) {
  if (!handoff) {
    return null;
  }

  return (
    <div className="ui-surface-primary overflow-hidden border-[rgba(114,213,154,0.18)] bg-[linear-gradient(180deg,rgba(114,213,154,0.08),rgba(255,255,255,0.02)_34%,transparent_100%)] shadow-[0_12px_24px_rgba(10,24,18,0.12)]">
      <div className="border-b border-[var(--border-subtle)] px-5 py-5 sm:px-6">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--success-strong)]">
            {handoff.title}
          </p>
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
            Move from direction into action.
          </h2>
        </div>
      </div>

      <div className="space-y-4 p-5 sm:p-6">
        <div className="ui-metadata-block border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.022)] px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
            What is now understood
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--text-primary)]">{handoff.understood}</p>
        </div>

        <div className="ui-surface-accent space-y-2 border-[rgba(114,213,154,0.18)] px-5 py-5 shadow-[0_10px_22px_rgba(10,24,18,0.1)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--success-strong)]">
            What you should do now
          </p>
          <p className="text-[1.05rem] font-semibold leading-8 tracking-[-0.03em] text-[var(--text-primary)]">
            {handoff.nextStep}
          </p>
        </div>

        <div className="ui-metadata-block border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.022)] px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
            What happens after that
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{handoff.afterThis}</p>
        </div>
      </div>
    </div>
  );
}
