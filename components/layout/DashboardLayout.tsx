import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--shell-background)] text-[var(--text-primary)]">
      <div className="relative flex min-h-screen">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(109,156,255,0.08),_transparent_30%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_18%,transparent_82%,rgba(255,255,255,0.015))]" />
        <Sidebar />
        <div className="relative flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="flex-1 px-8 py-8 lg:px-10 lg:py-10 xl:px-12">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
