import React from 'react';

interface GuidanceErrorCardProps {
  error: string;
}

export function GuidanceErrorCard({ error }: GuidanceErrorCardProps) {
  return (
    <div className="rounded-[16px] border border-[rgba(242,202,115,0.2)] bg-[var(--warning-soft)] px-5 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--warning-strong)]">
        Guidance needs attention
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--text-primary)]">{error}</p>
      <p className="mt-1 text-xs text-[var(--text-secondary)]">
        Refine the request below or keep moving with the current objective until fresh guidance is available.
      </p>
    </div>
  );
}
