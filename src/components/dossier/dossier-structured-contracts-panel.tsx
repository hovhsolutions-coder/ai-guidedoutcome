'use client';

import { type GuidanceNarrativeContract, type GuidanceSystemPlanContract, type GuidanceExecutionPlanContract } from '@/src/lib/guidance-session/types';

interface DossierStructuredContractsPanelProps {
  narrative?: GuidanceNarrativeContract | null;
  systemPlan?: GuidanceSystemPlanContract | null;
  executionPlan?: GuidanceExecutionPlanContract | null;
}

function NarrativeSection({ narrative }: { narrative: GuidanceNarrativeContract }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
          Situation
        </h3>
        <span className="text-[11px] text-[var(--text-muted)]">
          {Math.round(narrative.confidence * 100)}% confidence
        </span>
      </div>
      
      <p className="text-sm leading-6 text-[var(--text-primary)]">
        {narrative.situation}
      </p>
      
      <div className="space-y-2">
        <h4 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
          Goal
        </h4>
        <p className="text-sm leading-5 text-[var(--text-secondary)]">
          {narrative.goal}
        </p>
      </div>
      
      {narrative.constraints.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Constraints
          </h4>
          <ul className="space-y-1">
            {narrative.constraints.map((constraint, index) => (
              <li key={index} className="text-sm text-[var(--text-secondary)] flex items-start gap-2">
                <span className="text-[var(--text-muted)] mt-1">•</span>
                {constraint}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {narrative.context && (
        <div className="space-y-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Context
          </h4>
          <p className="text-sm leading-5 text-[var(--text-secondary)]">
            {narrative.context}
          </p>
        </div>
      )}
    </div>
  );
}

function SystemPlanSection({ systemPlan }: { systemPlan: GuidanceSystemPlanContract }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
          System Plan
        </h3>
        <span className="text-[11px] text-[var(--text-muted)]">
          {systemPlan.departments.length} departments
        </span>
      </div>
      
      {systemPlan.strategicPriorities.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Strategic Priorities
          </h4>
          <ul className="space-y-1">
            {systemPlan.strategicPriorities.map((priority, index) => (
              <li key={index} className="text-sm text-[var(--text-secondary)] flex items-start gap-2">
                <span className="text-[var(--accent-primary)] mt-1">›</span>
                {priority}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="space-y-3">
        <h4 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
          Departments
        </h4>
        <div className="grid gap-2 sm:grid-cols-2">
          {systemPlan.departments.slice(0, 4).map((dept) => (
            <div
              key={dept.id}
              className={`rounded-[12px] border px-3 py-2 ${
                dept.id === systemPlan.primaryDepartment
                  ? 'border-[rgba(109,156,255,0.3)] bg-[rgba(109,156,255,0.06)]'
                  : 'border-[var(--border-subtle)] bg-[rgba(255,255,255,0.02)]'
              }`}
            >
              <p className="text-sm font-medium text-[var(--text-primary)]">{dept.name}</p>
              <p className="text-xs text-[var(--text-muted)] truncate">{dept.role}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExecutionPlanSection({ executionPlan }: { executionPlan: GuidanceExecutionPlanContract }) {
  const criticalPathTasks = executionPlan.tasks.filter((t) =>
    executionPlan.criticalPath.includes(t.id)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
          Execution Plan
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-[var(--text-muted)]">
            {executionPlan.tasks.length} tasks
          </span>
          {executionPlan.totalEstimatedDuration && (
            <span className="text-[11px] text-[var(--accent-primary)]">
              {executionPlan.totalEstimatedDuration}
            </span>
          )}
        </div>
      </div>
      
      {criticalPathTasks.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-primary)]">
            Critical Path
          </h4>
          <div className="space-y-1">
            {criticalPathTasks.slice(0, 3).map((task, index) => (
              <div
                key={task.id}
                className="flex items-center gap-2 text-sm text-[var(--text-primary)]"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[rgba(109,156,255,0.15)] text-[11px] font-medium text-[var(--accent-primary)]">
                  {index + 1}
                </span>
                <span className="flex-1 truncate">{task.title}</span>
                <span className="text-xs text-[var(--text-muted)]">{task.estimatedDuration}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {executionPlan.milestones.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Milestones
          </h4>
          <div className="space-y-2">
            {executionPlan.milestones.slice(0, 3).map((milestone, index) => (
              <div
                key={index}
                className="rounded-[10px] border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.02)] px-3 py-2"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{milestone.name}</p>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    {milestone.tasks.length} tasks
                  </span>
                </div>
                {milestone.targetDate && (
                  <p className="text-xs text-[var(--text-muted)]">
                    Target: {milestone.targetDate}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function DossierStructuredContractsPanel({
  narrative,
  systemPlan,
  executionPlan,
}: DossierStructuredContractsPanelProps) {
  const hasAnyContracts = narrative || systemPlan || executionPlan;

  if (!hasAnyContracts) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
          Mission Intelligence
        </h2>
        <span className="text-[10px] text-[var(--text-muted)]">
          Generated from guidance session
        </span>
      </div>

      {narrative && (
        <div className="ui-metadata-block space-y-4 border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.02)] px-4 py-4">
          <NarrativeSection narrative={narrative} />
        </div>
      )}

      {systemPlan && (
        <div className="ui-metadata-block space-y-4 border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.02)] px-4 py-4">
          <SystemPlanSection systemPlan={systemPlan} />
        </div>
      )}

      {executionPlan && (
        <div className="ui-metadata-block space-y-4 border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.02)] px-4 py-4">
          <ExecutionPlanSection executionPlan={executionPlan} />
        </div>
      )}
    </div>
  );
}
