import React from 'react';
import { cn } from '../../lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  isPrimary?: boolean;
}

export function StatsCard({ title, value, description, isPrimary = false }: StatsCardProps) {
  return (
    <div className={cn(
      isPrimary ? 'ui-surface-accent ring-1 ring-[rgba(109,156,255,0.12)]' : 'ui-surface-primary',
      'p-8'
    )}>
      <div className="flex items-center justify-between">
        <div>
          <p className={cn(
            'text-[11px] font-semibold uppercase tracking-[0.16em]',
            isPrimary ? 'text-[var(--accent-primary-strong)]' : 'text-[var(--text-secondary)]'
          )}>
            {title}
          </p>
          <p className={cn(
            isPrimary ? 'text-5xl' : 'text-4xl',
            'mt-3 font-semibold tracking-[-0.04em] text-[var(--text-primary)]'
          )}>
            {value}
          </p>
          {description && (
            <p className="mt-3 text-xs font-medium text-[var(--text-muted)]">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
