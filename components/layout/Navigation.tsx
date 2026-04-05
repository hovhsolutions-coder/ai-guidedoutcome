 'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '../../lib/utils';

const navigationItems = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'My Dossiers', href: '/dossiers' },
  { name: 'New Dossier', href: '/dossiers/new' },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="space-y-3">
      {navigationItems.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          className={cn(
            'group flex items-center rounded-lg border px-4 py-3 text-sm font-medium transition-all duration-200',
            isActiveRoute(pathname, item.href)
              ? 'border-[rgba(109,156,255,0.28)] bg-[var(--accent-primary-soft)] text-[var(--accent-primary-strong)] shadow-[var(--shadow-control)]'
              : 'border-transparent text-[var(--text-secondary)] hover:border-[var(--border-subtle)] hover:bg-[rgba(255,255,255,0.03)] hover:text-[var(--text-primary)]'
          )}
        >
          {item.name}
        </Link>
      ))}
    </nav>
  );
}

function isActiveRoute(pathname: string | null, href: string): boolean {
  if (!pathname) {
    return false;
  }

  if (href === '/dashboard') {
    return pathname === '/dashboard';
  }

  if (href === '/dossiers/new') {
    return pathname === '/dossiers/new';
  }

  if (href === '/dossiers') {
    return pathname === '/dossiers' || /^\/dossiers\/[^/]+$/.test(pathname);
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
