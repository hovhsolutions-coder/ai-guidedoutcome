 'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { type AuthUser } from '@/src/lib/auth/auth';

interface TopbarProps {
  user: AuthUser | null;
}

export function Topbar({ user }: TopbarProps) {
  const pathname = usePathname();
  const context = getTopbarContext(pathname);
  const initials = user?.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? 'GO';

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
          {user ? (
            <>
              <div className="hidden rounded-full border border-[var(--border-strong)] bg-[var(--surface-primary)] px-4 py-2 text-sm text-[var(--text-secondary)] lg:block">
                {user.email}
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--surface-primary)] text-sm font-semibold text-[var(--text-primary)] shadow-[var(--shadow-panel)]">
                {initials}
              </div>
              <SignOutButton />
            </>
          ) : (
            <Link href="/sign-in" className="ui-button-secondary">
              Sign in
            </Link>
          )}
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
  if (!pathname || pathname === '/dashboard') {
    return {
      eyebrow: 'Dashboard',
      title: 'Your workspace',
      subtitle: 'See what is active, what is blocked, and what to move next.',
    };
  }

  if (pathname === '/dossiers') {
    return {
      eyebrow: 'Workspace',
      title: 'My Dossiers',
      subtitle: 'Open saved dossiers, continue work, or start a new one cleanly.',
    };
  }

  if (pathname === '/dossiers/new') {
    return {
      eyebrow: 'Creation',
      title: 'New Dossier',
      subtitle: 'Capture your situation, choose your coach style, and open a guided first draft.',
    };
  }

  if (pathname.startsWith('/dossiers/')) {
    return {
      eyebrow: 'Dossier Detail',
      title: 'Guided Outcome',
      subtitle: 'Continue the live dossier with context, tasks, and progress in one place.',
    };
  }

  return {
    eyebrow: 'Workspace',
    title: 'AI Guided Outcome',
    subtitle: 'Your personal dossier workspace.',
  };
}
