import React from 'react';
import { type GuidanceContentDensity } from '@/src/components/guidance/guidance-presentation-contracts';

interface GuidanceCurrentReadProps {
  summary: string;
  label?: string;
  density?: GuidanceContentDensity | null;
}

export function GuidanceCurrentRead({
  summary,
  label = 'Summary',
  density = 'guided',
}: GuidanceCurrentReadProps) {
  return (
    <div className={`ui-surface-secondary border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.022)] ${density === 'minimal' ? 'space-y-2 p-4' : 'space-y-3 p-5'}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-primary-strong)]">
        {label}
      </p>
      <p className={`text-base font-medium text-[var(--text-primary)] ${density === 'minimal' ? 'leading-6' : 'leading-7'}`}>{summary}</p>
    </div>
  );
}
