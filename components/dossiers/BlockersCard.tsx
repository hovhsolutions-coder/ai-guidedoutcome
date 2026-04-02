import React from 'react';

interface BlockersCardProps {
  title: string;
  description: string;
}

export function BlockersCard({ title, description }: BlockersCardProps) {
  return (
    <div className="ui-surface-secondary h-full border border-[rgba(242,202,115,0.2)] bg-[linear-gradient(180deg,rgba(242,202,115,0.06),rgba(255,255,255,0.02))] p-5">
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--warning-strong)]">
          Momentum watch
        </p>
        <h2 className="text-xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">{title}</h2>
        <p className="text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
      </div>
    </div>
  );
}
