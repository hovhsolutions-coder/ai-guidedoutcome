 'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export function Topbar() {
  const pathname = usePathname();
  const context = getTopbarContext(pathname);

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border-subtle)] bg-[color:var(--surface-secondary)]/88 backdrop-blur-xl">
      <div className="flex min-h-[80px] items-center justify-between gap-6 px-8 py-4 lg:px-10 xl:px-12">
        <div className="min-w-0 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]/80">
            {context.eyebrow}
          </p>
          <div className="flex items-end gap-3">
            <h1 className="text-2xl font-semibold tracking-[-0.035em] text-[var(--text-primary)]">
              {context.title}
            </h1>
            <p className="hidden pb-0.5 text-sm text-[var(--text-secondary)] md:block">
              {context.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden rounded-full border border-[var(--border-strong)] bg-[var(--surface-primary)] px-4 py-2 text-sm text-[var(--text-secondary)] lg:block">
            Workspace active
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--surface-primary)] text-sm font-semibold text-[var(--text-primary)] shadow-[var(--shadow-panel)]">
            U
          </div>
        </div>
      </div>
    </header>
  );
}

function getTopbarContext(pathname: string | null): {
  eyebrow: string;
  title: string;
  subtitle: string;
} {
  if (!pathname || pathname === '/') {
    return {
      eyebrow: 'Overview',
      title: 'Command Center',
      subtitle: 'Calm visibility across dossiers, tasks, and guided execution.',
    };
  }

  if (pathname === '/dossiers') {
    return {
      eyebrow: 'Workspace',
      title: 'Dossiers',
      subtitle: 'Review active dossiers, their current phase, and where attention is needed.',
    };
  }

  if (pathname === '/dossiers/new') {
    return {
      eyebrow: 'Creation',
      title: 'New Dossier',
      subtitle: 'Turn a messy situation into a structured starting point before entering execution.',
    };
  }

  if (pathname.startsWith('/dossiers/')) {
    return {
      eyebrow: 'Dossier Detail',
      title: 'Guided Outcome',
      subtitle: 'Keep context, tasks, and AI guidance aligned in one working surface.',
    };
  }

  return {
    eyebrow: 'Workspace',
    title: 'AI Guided Outcome',
    subtitle: 'Structured decision support for dossiers, execution, and progress.',
  };
}
