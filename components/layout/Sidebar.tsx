import React from 'react';
import { Navigation } from './Navigation';

export function Sidebar() {
  return (
    <aside className="relative hidden w-72 shrink-0 border-r border-[var(--border-subtle)] bg-[var(--surface-secondary)]/95 backdrop-blur-xl lg:flex lg:flex-col">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent_18%,transparent_84%,rgba(255,255,255,0.02))]" />
      <div className="relative border-b border-[var(--border-subtle)] px-6 py-6">
        <div className="space-y-3">
          <div className="inline-flex items-center rounded-full border border-[var(--border-strong)] bg-[var(--accent-primary-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-primary)]">
            Strategic Workspace
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">AI Guided Outcome</h2>
            <p className="text-sm leading-6 text-[var(--text-secondary)]">
              Structured decision support for dossiers, execution, and progress.
            </p>
          </div>
        </div>
      </div>

      <div className="relative flex-1 overflow-y-auto px-4 py-6">
        <div className="mb-4 px-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]/80">
            Navigation
          </p>
        </div>
        <nav className="space-y-1.5">
          <Navigation />
        </nav>
      </div>

      <div className="relative border-t border-[var(--border-subtle)] px-6 py-5">
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)]/75">Focused Mode</p>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          Keep dossiers calm, current, and actionable.
        </p>
      </div>
    </aside>
  );
}
