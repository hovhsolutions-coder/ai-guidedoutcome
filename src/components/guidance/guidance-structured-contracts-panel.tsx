'use client';

import React from 'react';
import {
  type GuidanceNarrativeContract,
  type GuidanceSystemPlanContract,
  type GuidanceExecutionPlanContract,
} from '@/src/lib/guidance-session/types';

interface GuidanceNarrativePanelProps {
  narrative: GuidanceNarrativeContract;
  isMinimal?: boolean;
}

export function GuidanceNarrativePanel({ narrative, isMinimal = false }: GuidanceNarrativePanelProps) {
  return (
    <div className="ui-surface-secondary space-y-4 px-4 py-4">
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
          Situation
        </p>
        <p className="text-sm leading-6 text-[var(--text-primary)]">
          {narrative.situation}
        </p>
      </div>
      
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
          Goal
        </p>
        <p className="text-sm leading-6 text-[var(--accent-primary-strong)]">
          {narrative.goal}
        </p>
      </div>
      
      {!isMinimal && narrative.constraints.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
            Constraints
          </p>
          <ul className="space-y-1">
            {narrative.constraints.map((constraint, index) => (
              <li key={index} className="text-xs text-[var(--text-secondary)] flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-[var(--accent-primary)]" />
                {constraint}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {!isMinimal && (
        <div className="pt-2 border-t border-[var(--border-subtle)]">
          <p className="text-[10px] text-[var(--text-muted)]">
            Confidence: {Math.round(narrative.confidence * 100)}%
          </p>
        </div>
      )}
    </div>
  );
}

interface GuidanceSystemPlanPanelProps {
  systemPlan: GuidanceSystemPlanContract;
  isMinimal?: boolean;
}

export function GuidanceSystemPlanPanel({ systemPlan, isMinimal = false }: GuidanceSystemPlanPanelProps) {
  return (
    <div className="ui-surface-secondary space-y-4 px-4 py-4">
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
          System Plan
        </p>
        <p className="text-xs text-[var(--text-muted)]">
          {systemPlan.departments.length} departments • Primary: {systemPlan.departments.find(d => d.id === systemPlan.primaryDepartment)?.name}
        </p>
      </div>
      
      <div className="space-y-2">
        {systemPlan.departments.map((dept) => (
          <div 
            key={dept.id} 
            className={`space-y-1 p-2 rounded ${dept.id === systemPlan.primaryDepartment ? 'bg-[var(--surface-primary)] border border-[var(--accent-primary)]/20' : ''}`}
          >
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {dept.name}
              {dept.id === systemPlan.primaryDepartment && (
                <span className="ml-2 text-[10px] text-[var(--accent-primary)]">(Lead)</span>
              )}
            </p>
            {!isMinimal && (
              <>
                <p className="text-xs text-[var(--text-secondary)]">{dept.role}</p>
                {dept.responsibilities.length > 0 && (
                  <p className="text-xs text-[var(--text-muted)]">
                    {dept.responsibilities.length} responsibilities
                  </p>
                )}
              </>
            )}
          </div>
        ))}
      </div>
      
      {!isMinimal && systemPlan.strategicPriorities.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
            Strategic Priorities
          </p>
          <ul className="space-y-1">
            {systemPlan.strategicPriorities.slice(0, 3).map((priority, index) => (
              <li key={index} className="text-xs text-[var(--text-secondary)] flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-[var(--accent-primary)]" />
                {priority}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

interface GuidanceExecutionPlanPanelProps {
  executionPlan: GuidanceExecutionPlanContract;
  isMinimal?: boolean;
}

export function GuidanceExecutionPlanPanel({ executionPlan, isMinimal = false }: GuidanceExecutionPlanPanelProps) {
  const criticalTasks = executionPlan.tasks.filter(t => executionPlan.criticalPath.includes(t.id));
  
  return (
    <div className="ui-surface-secondary space-y-4 px-4 py-4">
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
          Execution Plan
        </p>
        <p className="text-xs text-[var(--text-muted)]">
          {executionPlan.tasks.length} tasks • {executionPlan.totalEstimatedDuration}
        </p>
      </div>
      
      <div className="space-y-2">
        {executionPlan.tasks.slice(0, isMinimal ? 3 : 5).map((task, index) => (
          <div 
            key={task.id} 
            className={`space-y-1 p-2 rounded ${task.priority === 'critical' ? 'bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30' : 'bg-[var(--surface-primary)]'}`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {index + 1}. {task.title}
              </p>
              <span className={`text-[10px] px-2 py-0.5 rounded ${
                task.priority === 'critical' ? 'bg-[var(--accent-primary)] text-white' :
                task.priority === 'high' ? 'bg-[var(--warning-soft)] text-[var(--warning-strong)]' :
                'bg-[var(--surface-secondary)] text-[var(--text-muted)]'
              }`}>
                {task.priority}
              </span>
            </div>
            {!isMinimal && (
              <>
                <p className="text-xs text-[var(--text-secondary)]">{task.description}</p>
                <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
                  <span>{task.estimatedDuration}</span>
                  <span>•</span>
                  <span>{task.department}</span>
                </div>
              </>
            )}
          </div>
        ))}
        {executionPlan.tasks.length > (isMinimal ? 3 : 5) && (
          <p className="text-xs text-[var(--text-muted)] text-center py-2">
            +{executionPlan.tasks.length - (isMinimal ? 3 : 5)} more tasks
          </p>
        )}
      </div>
      
      {!isMinimal && executionPlan.milestones.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
            Milestones
          </p>
          <div className="space-y-1">
            {executionPlan.milestones.slice(0, 2).map((milestone, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)]" />
                <span className="text-[var(--text-primary)]">{milestone.name}</span>
                <span className="text-[var(--text-muted)]">({milestone.tasks.length} tasks)</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface GuidanceStructuredContractsPanelProps {
  narrative?: GuidanceNarrativeContract | null;
  systemPlan?: GuidanceSystemPlanContract | null;
  executionPlan?: GuidanceExecutionPlanContract | null;
  isMinimal?: boolean;
}

export function GuidanceStructuredContractsPanel({
  narrative,
  systemPlan,
  executionPlan,
  isMinimal = false,
}: GuidanceStructuredContractsPanelProps) {
  const hasAnyData = narrative || systemPlan || executionPlan;
  
  if (!hasAnyData) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
          Structured Analysis
        </p>
      </div>
      
      {narrative && (
        <GuidanceNarrativePanel narrative={narrative} isMinimal={isMinimal} />
      )}
      
      {systemPlan && (
        <GuidanceSystemPlanPanel systemPlan={systemPlan} isMinimal={isMinimal} />
      )}
      
      {executionPlan && (
        <GuidanceExecutionPlanPanel executionPlan={executionPlan} isMinimal={isMinimal} />
      )}
    </div>
  );
}
