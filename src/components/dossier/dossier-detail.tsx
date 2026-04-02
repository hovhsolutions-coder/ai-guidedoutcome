'use client';

import { useState } from 'react';
import { DossierStructuredContractsPanel } from './dossier-structured-contracts-panel';
import { type MockDossier } from '@/lib/mockData';

interface DossierDetailProps {
  dossier: MockDossier;
}

function DossierHeader({ dossier }: { dossier: MockDossier }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-primary)]">
          {dossier.phase}
        </span>
        <span className="text-[10px] text-[var(--text-muted)]">
          {dossier.progress}% complete
        </span>
      </div>
      <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
        {dossier.title}
      </h1>
      <p className="text-sm text-[var(--text-secondary)]">
        {dossier.main_goal}
      </p>
    </div>
  );
}

function DossierCoreInfo({ dossier }: { dossier: MockDossier }) {
  return (
    <div className="ui-metadata-block space-y-4 border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.02)] px-4 py-4">
      <div className="space-y-3">
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Situation
          </h3>
          <p className="mt-1 text-sm leading-5 text-[var(--text-primary)]">
            {dossier.situation}
          </p>
        </div>
        
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Main Goal
          </h3>
          <p className="mt-1 text-sm leading-5 text-[var(--text-primary)]">
            {dossier.main_goal}
          </p>
        </div>
        
        {dossier.tasks.length > 0 && (
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              Tasks ({dossier.tasks.length})
            </h3>
            <ul className="mt-2 space-y-1">
              {dossier.tasks.slice(0, 5).map((task, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-[var(--text-secondary)]"
                >
                  <span className="text-[var(--text-muted)] mt-1">•</span>
                  {typeof task === 'string' ? task : task.name}
                </li>
              ))}
              {dossier.tasks.length > 5 && (
                <li className="text-xs text-[var(--text-muted)] pl-4">
                  +{dossier.tasks.length - 5} more tasks
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export function DossierDetail({ dossier }: DossierDetailProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'intelligence'>('overview');
  
  const hasStructuredContracts = dossier.narrative || dossier.systemPlan || dossier.executionPlan;

  return (
    <div className="space-y-6">
      <DossierHeader dossier={dossier} />
      
      {hasStructuredContracts && (
        <div className="flex gap-1 rounded-[12px] border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.02)] p-1">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex-1 rounded-[8px] px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-[rgba(109,156,255,0.15)] text-[var(--accent-primary)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('intelligence')}
            className={`flex-1 rounded-[8px] px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === 'intelligence'
                ? 'bg-[rgba(109,156,255,0.15)] text-[var(--accent-primary)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Mission Intelligence
          </button>
        </div>
      )}
      
      {activeTab === 'overview' ? (
        <DossierCoreInfo dossier={dossier} />
      ) : (
        <DossierStructuredContractsPanel
          narrative={dossier.narrative}
          systemPlan={dossier.systemPlan}
          executionPlan={dossier.executionPlan}
        />
      )}
    </div>
  );
}
