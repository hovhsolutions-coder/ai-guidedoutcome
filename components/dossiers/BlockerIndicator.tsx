import React from 'react';
import { cn } from '@/lib/utils';

interface BlockerIndicatorProps {
  label: string;
  tone: 'blocker' | 'momentum' | 'steady';
}

export function BlockerIndicator({ label, tone }: BlockerIndicatorProps) {
  return (
    <div
      className={cn(
        'rounded-[16px] border px-4 py-3 text-sm leading-6',
        tone === 'blocker' && 'border-[rgba(242,202,115,0.18)] bg-[rgba(242,202,115,0.08)] text-[var(--warning-strong)]',
        tone === 'momentum' && 'border-[rgba(114,213,154,0.18)] bg-[var(--success-soft)] text-[var(--success-strong)]',
        tone === 'steady' && 'border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] text-[var(--text-secondary)]'
      )}
    >
      {label}
    </div>
  );
}
