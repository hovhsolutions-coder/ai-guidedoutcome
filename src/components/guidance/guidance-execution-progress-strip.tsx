'use client';

interface GuidanceExecutionProgressStripProps {
  progress: {
    eyebrow: string;
    title: string;
    summary: string;
    checkpoints: string[];
  } | null;
}

export function GuidanceExecutionProgressStrip({ progress }: GuidanceExecutionProgressStripProps) {
  if (!progress) {
    return null;
  }

  return (
    <div className="ui-surface-secondary overflow-hidden border-[rgba(114,213,154,0.18)] bg-[linear-gradient(180deg,rgba(114,213,154,0.08),rgba(255,255,255,0.02)_48%,transparent_100%)]">
      <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--success-strong)]">
            {progress.eyebrow}
          </p>
          <p className="text-sm font-medium text-[var(--text-primary)]">{progress.title}</p>
          <p className="text-xs leading-5 text-[var(--text-secondary)]">{progress.summary}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {progress.checkpoints.map((checkpoint) => (
            <span
              key={checkpoint}
              className="rounded-full border border-[rgba(114,213,154,0.18)] bg-[rgba(114,213,154,0.12)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--success-strong)]"
            >
              {checkpoint}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
