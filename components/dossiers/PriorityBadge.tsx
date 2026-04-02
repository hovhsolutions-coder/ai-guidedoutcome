import React from 'react';
import { cn } from '@/lib/utils';

interface PriorityBadgeProps {
  label: string;
  tone: 'focus' | 'active' | 'watch';
}

export function PriorityBadge({ label, tone }: PriorityBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]',
        tone === 'focus' && 'bg-[var(--accent-primary-soft)] text-[var(--accent-primary-strong)]',
        tone === 'active' && 'bg-[rgba(255,255,255,0.08)] text-[var(--text-secondary)]',
        tone === 'watch' && 'bg-[rgba(242,202,115,0.1)] text-[var(--warning-strong)]'
      )}
    >
      {label}
    </span>
  );
}
