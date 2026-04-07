import React from 'react';
import { cn } from '@/lib/utils';
import { type DossierPhase, type Task, type TaskPriority, type ActivityEntry } from '@/lib/mockData';
import { CompletedTaskGroup } from '@/components/dossiers/CompletedTaskGroup';
import { PriorityTaskCard } from '@/components/dossiers/PriorityTaskCard';
import { QueuedTaskList } from '@/components/dossiers/QueuedTaskList';
import { generateExecutionContext, type ExecutionContext } from '@/src/lib/execution/execution-context';
import { generateScheduleRecommendation, type ScheduleRecommendation } from '@/src/lib/scheduling/engine';
import { generateProgressAnalytics, type ProgressAnalytics } from '@/src/lib/analytics/engine';
import { ExecutionGuidancePanel } from '@/components/dossiers/ExecutionGuidancePanel';

// Helper to calculate overall dossier progress including subtasks
function calculateDossierProgress(
  tasks: Task[],
  completedTasks: Set<string>
): { total: number; completed: number; percentage: number } {
  let totalItems = 0;
  let completedItems = 0;

  tasks.forEach((task) => {
    if (task.subtasks && task.subtasks.length > 0) {
      // Count subtasks as individual items
      totalItems += task.subtasks.length;
      completedItems += task.subtasks.filter((s) => s.completed).length;
    } else {
      // Count task itself as one item
      totalItems += 1;
      if (completedTasks.has(task.name)) {
        completedItems += 1;
      }
    }
  });

  const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  return { total: totalItems, completed: completedItems, percentage };
}

// Helper to get next best action message
function getNextBestAction(
  tasks: Task[],
  completedTasks: Set<string>,
  priorityTask: Task | null | undefined,
  isPriorityBlocked: boolean
): { message: string; action: string; urgency: 'high' | 'medium' | 'low' } {
  const activeTasks = tasks.filter((t) => !completedTasks.has(t.name));

  // Completion state - all tasks done
  if (activeTasks.length === 0 && tasks.length > 0) {
    return { 
      message: 'Every task is complete. Take a moment to acknowledge what you have accomplished.', 
      action: 'Work completed — time to close out', 
      urgency: 'low' 
    };
  }

  // Near-completion: only 1 task remaining
  if (activeTasks.length === 1) {
    const lastTask = activeTasks[0];
    return {
      message: `One final task remains: "${lastTask.name}". Finish strong and close this out.`,
      action: 'Complete the final task',
      urgency: 'high',
    };
  }

  // Near-completion: 2-3 tasks remaining
  if (activeTasks.length <= 3 && tasks.length > 3) {
    return {
      message: `Only ${activeTasks.length} tasks left. You are nearly at the finish line.`,
      action: 'Push through to completion',
      urgency: 'high',
    };
  }

  if (isPriorityBlocked && priorityTask) {
    const blockingDeps = priorityTask.dependencies?.filter((dep) => !completedTasks.has(dep)) || [];
    return {
      message: `Priority task blocked by: ${blockingDeps.join(', ')}`,
      action: `Complete ${blockingDeps[0]} first`,
      urgency: 'high',
    };
  }

  if (priorityTask) {
    return {
      message: `Focus on: ${priorityTask.name}`,
      action: 'Start working on priority task',
      urgency: 'high',
    };
  }

  const highPriorityTask = activeTasks.find((t) => t.priority === 'high');
  if (highPriorityTask) {
    return {
      message: `High priority: ${highPriorityTask.name}`,
      action: 'Address high priority task',
      urgency: 'high',
    };
  }

  return {
    message: `${activeTasks.length} tasks remaining`,
    action: 'Pick any task to continue',
    urgency: 'medium',
  };
}

// Helper to determine smart status label with stage awareness
function getSmartStatusLabel(
  tasks: Task[],
  completedTasks: Set<string>,
  phase: DossierPhase,
  guidanceNextStep?: string | null
): { label: string; variant: 'success' | 'warning' | 'info' | 'neutral' } {
  const activeTasks = tasks.filter((t) => !completedTasks.has(t.name));
  const doneCount = completedTasks.size;
  const totalCount = tasks.length;
  const percentage = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  if (phase === 'Completed') {
    return { label: 'Completed', variant: 'success' };
  }

  // Startup phase - 0% progress
  if (doneCount === 0) {
    return { label: 'Ready to start', variant: 'info' };
  }

  // Finishing phase - high progress
  if (percentage >= 75) {
    return { label: 'Finishing up', variant: 'warning' };
  }

  // Almost done states
  if (activeTasks.length === 1) {
    return { label: 'Last task', variant: 'warning' };
  }

  if (doneCount === totalCount - 1 && totalCount > 0) {
    return { label: 'One task left', variant: 'warning' };
  }

  // Momentum phase - guidance available takes priority
  if (guidanceNextStep) {
    return { label: 'Guidance ready', variant: 'info' };
  }

  // Default momentum state
  return { label: `${doneCount}/${totalCount} done`, variant: 'neutral' };
}

// Helper to check if a task is stalled (no activity for 3+ days)
function isTaskStalled(task: Task, activityHistory: ActivityEntry[], daysThreshold = 3): boolean {
  const taskActivities = activityHistory.filter(
    (a) => a.taskName === task.name && (a.type.includes('task') || a.type.includes('subtask'))
  );
  
  if (taskActivities.length === 0) {
    // No activity at all - check if task has been around for a while
    return true; // Consider new tasks without activity as potentially stalled
  }
  
  const lastActivity = taskActivities[taskActivities.length - 1];
  const lastActivityDate = new Date(lastActivity.timestamp);
  const now = new Date();
  const daysSinceActivity = (now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24);
  
  return daysSinceActivity > daysThreshold;
}

// Helper to find the task that unlocks the most other tasks (dependency resolver)
function findKeyUnlocker(
  tasks: Task[],
  completedTasks: Set<string>
): { task: Task | null; unlocksCount: number; unlocks: string[] } {
  const blockedTasks = tasks.filter(
    (t) => !completedTasks.has(t.name) && t.dependencies && t.dependencies.length > 0
  );
  
  const pendingTasks = tasks.filter((t) => !completedTasks.has(t.name));
  
  let maxUnlocks = 0;
  let keyUnlocker: Task | null = null;
  let unlocksList: string[] = [];
  
  for (const task of pendingTasks) {
    const hasUncompletedDeps = task.dependencies?.some((dep) => !completedTasks.has(dep)) ?? false;
    if (hasUncompletedDeps) continue; // Skip tasks that are themselves blocked
    
    // Count how many blocked tasks depend on this task
    const unlocks = blockedTasks.filter((blocked) => 
      blocked.dependencies?.includes(task.name) ?? false
    );
    
    if (unlocks.length > maxUnlocks) {
      maxUnlocks = unlocks.length;
      keyUnlocker = task;
      unlocksList = unlocks.map((t) => t.name);
    }
  }
  
  return { task: keyUnlocker, unlocksCount: maxUnlocks, unlocks: unlocksList };
}

// Helper to calculate dossier health score and status
function calculateDossierHealth(
  tasks: Task[],
  completedTasks: Set<string>,
  activityHistory: ActivityEntry[]
): {
  status: 'healthy' | 'delayed' | 'blocked' | 'stalled';
  score: number; // 0-100
  daysSinceLastActivity: number;
  stalledTasks: Task[];
  blockedTasks: Task[];
  reason: string;
} {
  if (tasks.length === 0) {
    return {
      status: 'healthy',
      score: 100,
      daysSinceLastActivity: 0,
      stalledTasks: [],
      blockedTasks: [],
      reason: 'No tasks yet',
    };
  }
  
  const activeTasks = tasks.filter((t) => !completedTasks.has(t.name));
  
  if (activeTasks.length === 0) {
    return {
      status: 'healthy',
      score: 100,
      daysSinceLastActivity: 0,
      stalledTasks: [],
      blockedTasks: [],
      reason: 'All tasks completed',
    };
  }
  
  // Find blocked tasks
  const blockedTasks = activeTasks.filter((t) => {
    if (!t.dependencies || t.dependencies.length === 0) return false;
    return t.dependencies.some((dep) => !completedTasks.has(dep));
  });
  
  // Find stalled tasks
  const stalledTasks = activeTasks.filter((t) => isTaskStalled(t, activityHistory, 3));
  
  // Calculate days since any activity
  const lastActivity = activityHistory.length > 0 
    ? new Date(activityHistory[activityHistory.length - 1].timestamp)
    : null;
  const daysSinceLastActivity = lastActivity 
    ? (new Date().getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
    : 7; // Assume week if no history
  
  // Calculate health score (0-100)
  let score = 100;
  let reason = 'On track';
  let status: 'healthy' | 'delayed' | 'blocked' | 'stalled' = 'healthy';
  
  // Deductions
  if (blockedTasks.length > 0) {
    score -= blockedTasks.length * 15;
    status = 'blocked';
    reason = `${blockedTasks.length} task${blockedTasks.length > 1 ? 's' : ''} blocked by dependencies`;
  }
  
  if (stalledTasks.length > 0) {
    score -= stalledTasks.length * 10;
    if (status === 'healthy') {
      status = 'stalled';
      reason = `${stalledTasks.length} task${stalledTasks.length > 1 ? 's' : ''} stalled`;
    }
  }
  
  if (daysSinceLastActivity > 2) {
    score -= Math.min(20, (daysSinceLastActivity - 2) * 5);
    if (status === 'healthy') {
      status = 'delayed';
      reason = `No activity for ${Math.round(daysSinceLastActivity)} days`;
    }
  }
  
  score = Math.max(0, Math.min(100, score));
  
  return {
    status,
    score,
    daysSinceLastActivity,
    stalledTasks,
    blockedTasks,
    reason,
  };
}

type PriorityFilter = 'all' | TaskPriority;

interface ExecutionTaskPanelProps {
  tasks: Task[];
  completedTasks: Set<string>;
  phase: DossierPhase;
  guidanceNextStep?: string | null;
  currentObjective: string;
  focusBadge: string;
  statusLine: string;
  activityHistory?: ActivityEntry[];
  onToggleTask: (taskName: string, completed: boolean) => void;
  onDeleteTask?: (taskName: string) => void;
  onEditTask?: (oldTaskName: string, newTaskName: string) => void;
  onReorderTask?: (taskName: string, direction: 'up' | 'down') => void;
  onSetDueDate?: (taskName: string, dueDate: string | null) => void;
  onSetTaskNote?: (taskName: string, notes: string | null) => void;
  onSetPriority?: (taskName: string, priority: TaskPriority | null) => void;
  onSetCategory?: (taskName: string, category: string | null) => void;
  onSetEstimate?: (taskName: string, estimate: string | null) => void;
  onToggleTimeTracking?: (taskName: string) => void;
  onSetDependency?: (taskName: string, dependency: string | null) => void;
  onSetMilestone?: (taskName: string, milestone: string | null) => void;
  onAddSubtask?: (taskName: string, subtaskName: string) => void;
  onToggleSubtask?: (taskName: string, subtaskId: string) => void;
  onEditSubtask?: (taskName: string, subtaskId: string, newName: string) => void;
  onDeleteSubtask?: (taskName: string, subtaskId: string) => void;
  onBatchComplete?: (taskNames: string[]) => void;
  onBatchUncomplete?: (taskNames: string[]) => void;
  onBatchDelete?: (taskNames: string[]) => void;
  /** Callback to close out the dossier (move to Completed phase) */
  onCloseOutDossier?: () => void;
  /** Callback to export execution context to parent components */
  onExecutionContextChange?: (context: ExecutionContext) => void;
}

export function ExecutionTaskPanel({
  tasks,
  completedTasks,
  phase,
  guidanceNextStep,
  currentObjective,
  focusBadge,
  statusLine,
  activityHistory = [],
  onToggleTask,
  onDeleteTask,
  onEditTask,
  onReorderTask,
  onSetDueDate,
  onSetTaskNote,
  onSetPriority,
  onSetCategory,
  onSetEstimate,
  onToggleTimeTracking,
  onSetDependency,
  onSetMilestone,
  onAddSubtask,
  onToggleSubtask,
  onEditSubtask,
  onDeleteSubtask,
  onBatchComplete,
  onBatchUncomplete,
  onBatchDelete,
  onCloseOutDossier,
  onExecutionContextChange,
}: ExecutionTaskPanelProps) {
  const [priorityFilter, setPriorityFilter] = React.useState<PriorityFilter>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedTasks, setSelectedTasks] = React.useState<Set<string>>(new Set());
  const [isBatchMode, setIsBatchMode] = React.useState(false);

  const activeTasks = tasks.filter((task) => !completedTasks.has(task.name));
  const doneTasks = tasks.filter((task) => completedTasks.has(task.name));
  const priorityTask = getPriorityTask(activeTasks, guidanceNextStep);
  const isPriorityAligned = Boolean(
    priorityTask &&
      guidanceNextStep &&
      priorityTask.name.trim().toLowerCase() === guidanceNextStep.trim().toLowerCase()
  );

  // Calculate dossier progress (including subtasks)
  const dossierProgress = React.useMemo(() => calculateDossierProgress(tasks, completedTasks), [tasks, completedTasks]);

  // Get smart status label
  const statusLabel = React.useMemo(
    () => getSmartStatusLabel(tasks, completedTasks, phase, guidanceNextStep),
    [tasks, completedTasks, phase, guidanceNextStep]
  );

  // Check if priority task is blocked
  const isPriorityBlocked = priorityTask
    ? priorityTask.dependencies?.some((dep) => !completedTasks.has(dep)) ?? false
    : false;

  // Get next best action
  const nextBestAction = React.useMemo(
    () => getNextBestAction(tasks, completedTasks, priorityTask, isPriorityBlocked),
    [tasks, completedTasks, priorityTask, isPriorityBlocked]
  );

  // Calculate dossier health with full intelligence
  const dossierHealth = React.useMemo(
    () => calculateDossierHealth(tasks, completedTasks, activityHistory),
    [tasks, completedTasks, activityHistory]
  );

  // Find key unlocker task (dependency resolver)
  const keyUnlocker = React.useMemo(
    () => findKeyUnlocker(tasks, completedTasks),
    [tasks, completedTasks]
  );

  // Find stalled tasks
  const stalledTasks = React.useMemo(
    () => tasks.filter((t) => !completedTasks.has(t.name) && isTaskStalled(t, activityHistory, 3)),
    [tasks, completedTasks, activityHistory]
  );

  // Generate execution context for AI integration
  const executionContext = React.useMemo(
    () => generateExecutionContext(tasks, completedTasks, activityHistory, dossierHealth, keyUnlocker, stalledTasks),
    [tasks, completedTasks, activityHistory, dossierHealth, keyUnlocker, stalledTasks]
  );

  // Generate smart schedule recommendation
  const scheduleRecommendation = React.useMemo(
    () => generateScheduleRecommendation(tasks, completedTasks, executionContext),
    [tasks, completedTasks, executionContext]
  );

  // Generate progress analytics
  const progressAnalytics = React.useMemo(
    () => generateProgressAnalytics(tasks, completedTasks, activityHistory, dossierHealth.score),
    [tasks, completedTasks, activityHistory, dossierHealth.score]
  );

  // Export execution context to parent component when it changes
  React.useEffect(() => {
    if (onExecutionContextChange) {
      onExecutionContextChange(executionContext);
    }
  }, [executionContext, onExecutionContextChange]);

  // Search filter function
  const matchesSearch = React.useCallback((task: Task) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const nameMatch = task.name.toLowerCase().includes(query);
    const notesMatch = task.notes?.toLowerCase().includes(query) ?? false;
    return nameMatch || notesMatch;
  }, [searchQuery]);

  // Filter active tasks by priority (priority task always shown, queued tasks filtered)
  const filteredQueuedTasks = React.useMemo(() => {
    if (priorityFilter === 'all') return activeTasks;
    return activeTasks.filter((task) => {
      if (priorityTask && task.name === priorityTask.name) return true; // Always show priority task
      return task.priority === priorityFilter;
    });
  }, [activeTasks, priorityFilter, priorityTask]);

  // Apply search filter on top of priority filter
  const searchedQueuedTasks = React.useMemo(() => {
    return filteredQueuedTasks.filter(matchesSearch);
  }, [filteredQueuedTasks, matchesSearch]);

  // Simple priority-first sort (high > medium > low > none) if filter is 'all' and no search
  const sortedQueuedTasks = React.useMemo(() => {
    if (priorityFilter !== 'all' || searchQuery.trim()) return searchedQueuedTasks;
    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    return [...searchedQueuedTasks].sort((a, b) => {
      const aOrder = a.priority ? priorityOrder[a.priority] ?? 3 : 3;
      const bOrder = b.priority ? priorityOrder[b.priority] ?? 3 : 3;
      return aOrder - bOrder;
    });
  }, [searchedQueuedTasks, priorityFilter, searchQuery]);

  // Selection helpers
  const toggleTaskSelection = React.useCallback((taskName: string) => {
    setSelectedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskName)) {
        newSet.delete(taskName);
      } else {
        newSet.add(taskName);
      }
      return newSet;
    });
  }, []);

  const selectAllVisible = React.useCallback(() => {
    const visibleTaskNames = new Set(sortedQueuedTasks.map((t) => t.name));
    // Also include priority task if visible
    if (priorityTask && !completedTasks.has(priorityTask.name)) {
      visibleTaskNames.add(priorityTask.name);
    }
    setSelectedTasks(visibleTaskNames);
  }, [sortedQueuedTasks, priorityTask, completedTasks]);

  const clearSelection = React.useCallback(() => {
    setSelectedTasks(new Set());
  }, []);

  const handleToggle = (taskName: string) => {
    const isCompleted = completedTasks.has(taskName);
    onToggleTask(taskName, !isCompleted);
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className={cn(
            "text-[11px] font-semibold uppercase tracking-[0.16em]",
            getIntentPhaseColor(phase)
          )}>
            {getIntentPanelLabels(phase).sectionLabel}
          </p>
          <span className="rounded-full bg-[rgba(255,255,255,0.06)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
            {focusBadge}
          </span>
        </div>
        <h3 className="text-xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
          {getIntentPanelLabels(phase).panelTitle}
        </h3>
        <p className="text-sm leading-6 text-[var(--text-secondary)]">
          {getIntentPanelLabels(phase).description}{' '}
          <span className="text-[var(--text-primary)]">{currentObjective}</span>.
        </p>
      </div>

      {tasks.length > 0 && (
        <div className="ui-surface-secondary rounded-[18px] border border-[var(--border-subtle)] p-4 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-primary-strong)]">
                Coach focus now
              </p>
              <p className="text-sm font-semibold text-[var(--text-primary)]">{nextBestAction.action}</p>
              <p className="text-xs leading-5 text-[var(--text-secondary)]">{nextBestAction.message}</p>
            </div>
            <span className={cn(
              'rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]',
              nextBestAction.urgency === 'high' && 'bg-[var(--accent-error)]/20 text-[var(--accent-error)]',
              nextBestAction.urgency === 'medium' && 'bg-[var(--accent-warning)]/20 text-[var(--accent-warning)]',
              nextBestAction.urgency === 'low' && 'bg-[var(--color-green)]/20 text-[var(--color-green)]'
            )}>
              {nextBestAction.urgency === 'high' ? 'Priority' : nextBestAction.urgency === 'medium' ? 'Next' : 'Stable'}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span>Progress</span>
              <span>{dossierProgress.completed} / {dossierProgress.total} done</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[var(--border-subtle)]">
              <div
                className="h-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--color-green)] transition-all duration-500"
                style={{ width: `${dossierProgress.percentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-secondary)]">{dossierProgress.percentage}% complete</span>
              <span className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]',
                statusLabel.variant === 'success' && 'bg-[var(--color-green)]/20 text-[var(--color-green)]',
                statusLabel.variant === 'warning' && 'bg-[var(--accent-warning)]/20 text-[var(--accent-warning)]',
                statusLabel.variant === 'info' && 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]',
                statusLabel.variant === 'neutral' && 'bg-[rgba(255,255,255,0.1)] text-[var(--text-secondary)]'
              )}>
                {statusLabel.label}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Execution Guidance Panel - AI coaching during execution */}
      {tasks.length > 0 && (
        <ExecutionGuidancePanel
          executionContext={executionContext}
          scheduleRecommendation={scheduleRecommendation}
          progressAnalytics={progressAnalytics}
          onFocusTask={(taskName) => {
            const element = document.querySelector(`[data-task-name="${taskName}"]`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }}
          onViewBlocker={(taskName) => {
            const element = document.querySelector(`[data-task-name="${taskName}"]`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }}
        />
      )}

      {/* Completion state - all tasks done, dossier becomes work record */}
      {tasks.length > 0 && activeTasks.length === 0 && (
        <div className="ui-surface-primary border border-[var(--color-green)]/30 rounded-[18px] p-6 bg-[var(--color-green)]/5">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--color-green)] flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-[var(--text-primary)]">
                  Execution complete
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  All {doneTasks.length} task{doneTasks.length === 1 ? '' : 's'} finished. This dossier now serves as a record of what was accomplished.
                </p>
              </div>
            </div>

            <div className="pl-14 space-y-3">
              <p className="text-xs text-[var(--text-secondary)]">
                <span className="text-[var(--color-green)]">Available now:</span> Review completed tasks below, browse the full activity history, or reference this outcome for future work.
              </p>
              {onCloseOutDossier && phase !== 'Completed' && (
                <button
                  onClick={onCloseOutDossier}
                  className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-green)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-green)]/90 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Mark dossier as completed
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="ui-surface-primary border border-[rgba(94,142,242,0.3)] rounded-[18px] p-8 text-center bg-[rgba(94,142,242,0.04)]">
          <div className="mx-auto max-w-sm space-y-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-primary)] shadow-[0_4px_16px_rgba(94,142,242,0.4)]">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                Add your first task
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                One concrete action is all it takes to turn planning into progress. What will you do first?
              </p>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Tip: Start with something you can complete in 15-30 minutes.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Task controls - streamlined */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Compact priority pills */}
            <div className="flex items-center gap-1">
              {(['all', 'high', 'medium', 'low'] as PriorityFilter[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setPriorityFilter(filter)}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em] transition-colors',
                    priorityFilter === filter
                      ? filter === 'high'
                        ? 'bg-[var(--accent-error)]/20 text-[var(--accent-error)]'
                        : filter === 'medium'
                        ? 'bg-[var(--accent-warning)]/20 text-[var(--accent-warning)]'
                        : filter === 'low'
                        ? 'bg-[var(--text-secondary)]/20 text-[var(--text-secondary)]'
                        : 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  )}
                  aria-label={`Filter by ${filter} priority`}
                >
                  {filter === 'all' ? 'All' : filter}
                </button>
              ))}
            </div>

            {/* Compact search */}
            <div className="flex items-center gap-2 flex-1 min-w-[160px] max-w-[240px]">
              <div className="relative flex-1">
                <svg
                  className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-secondary)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Find task..."
                  className="w-full rounded-full border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] pl-7 pr-6 py-1 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/60 focus:border-[var(--accent-primary)] focus:outline-none focus:bg-[rgba(255,255,255,0.05)]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    aria-label="Clear search"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Compact batch toggle */}
            <button
              onClick={() => {
                setIsBatchMode(!isBatchMode);
                if (isBatchMode) clearSelection();
              }}
              className={cn(
                'ml-auto rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em] transition-colors',
                isBatchMode
                  ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              )}
              aria-label={isBatchMode ? 'Exit batch mode' : 'Enter batch mode'}
            >
              {isBatchMode ? 'Done' : 'Select'}
            </button>
          </div>

          {/* Batch action controls - only shown in batch mode with selections */}
          {isBatchMode && selectedTasks.size > 0 && (
            <div className="flex items-center gap-2 pl-1">
              <span className="text-[11px] text-[var(--text-secondary)]">
                {selectedTasks.size} selected
              </span>
              <div className="flex gap-1">
                <button
                  onClick={selectAllVisible}
                  className="rounded-md px-2 py-1 text-[10px] font-medium uppercase tracking-[0.1em] bg-[rgba(255,255,255,0.04)] text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.08)] transition-colors"
                >
                  Select all
                </button>
                <button
                  onClick={clearSelection}
                  className="rounded-md px-2 py-1 text-[10px] font-medium uppercase tracking-[0.1em] bg-[rgba(255,255,255,0.04)] text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.08)] transition-colors"
                >
                  Clear
                </button>
              </div>
              <div className="flex gap-1 ml-2">
                {onBatchComplete && (
                  <button
                    onClick={() => {
                      const incompleteSelected = Array.from(selectedTasks).filter(
                        (name) => !completedTasks.has(name)
                      );
                      if (incompleteSelected.length > 0) {
                        onBatchComplete(incompleteSelected);
                      }
                    }}
                    className="rounded-md px-2 py-1 text-[10px] font-medium uppercase tracking-[0.1em] bg-[var(--color-green)]/20 text-[var(--color-green)] hover:bg-[var(--color-green)]/30 transition-colors"
                  >
                    Complete
                  </button>
                )}
                {onBatchUncomplete && (
                  <button
                    onClick={() => {
                      const completedSelected = Array.from(selectedTasks).filter(
                        (name) => completedTasks.has(name)
                      );
                      if (completedSelected.length > 0) {
                        onBatchUncomplete(completedSelected);
                      }
                    }}
                    className="rounded-md px-2 py-1 text-[10px] font-medium uppercase tracking-[0.1em] bg-[var(--accent-warning)]/20 text-[var(--accent-warning)] hover:bg-[var(--accent-warning)]/30 transition-colors"
                  >
                    Uncomplete
                  </button>
                )}
                {onBatchDelete && (
                  <button
                    onClick={() => {
                      if (selectedTasks.size > 0) {
                        onBatchDelete(Array.from(selectedTasks));
                      }
                    }}
                    className="rounded-md px-2 py-1 text-[10px] font-medium uppercase tracking-[0.1em] bg-[var(--accent-error)]/20 text-[var(--accent-error)] hover:bg-[var(--accent-error)]/30 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          )}

          {priorityTask && (
            <PriorityTaskCard
              task={priorityTask}
              focusBadge={focusBadge}
              statusLine={statusLine}
              isAlignedWithGuidance={isPriorityAligned}
              onToggleTask={handleToggle}
              onDeleteTask={onDeleteTask}
              onEditTask={onEditTask}
              onReorderTask={onReorderTask}
              onSetDueDate={onSetDueDate}
              onSetTaskNote={onSetTaskNote}
              onSetPriority={onSetPriority}
              onSetCategory={onSetCategory}
              onSetEstimate={onSetEstimate}
              onToggleTimeTracking={onToggleTimeTracking}
              onSetDependency={onSetDependency}
              onSetMilestone={onSetMilestone}
              onAddSubtask={onAddSubtask}
              onToggleSubtask={onToggleSubtask}
              onEditSubtask={onEditSubtask}
              onDeleteSubtask={onDeleteSubtask}
              allTasks={activeTasks}
              completedTasks={completedTasks}
              isFirst={activeTasks[0] === priorityTask}
              isLast={activeTasks.length === 1}
              isBatchMode={isBatchMode}
              isSelected={selectedTasks.has(priorityTask.name)}
              onToggleSelection={() => toggleTaskSelection(priorityTask.name)}
              hasStarted={doneTasks.length > 0 && activeTasks.length > 0}
              isLastTask={activeTasks.length === 1}
            />
          )}

          <QueuedTaskList
            tasks={sortedQueuedTasks}
            priorityTask={priorityTask}
            guidanceTask={guidanceNextStep}
            onToggleTask={handleToggle}
            onDeleteTask={onDeleteTask}
            onEditTask={onEditTask}
            onReorderTask={onReorderTask}
            onSetDueDate={onSetDueDate}
            onSetTaskNote={onSetTaskNote}
            onSetPriority={onSetPriority}
            onSetCategory={onSetCategory}
            onSetEstimate={onSetEstimate}
            onToggleTimeTracking={onToggleTimeTracking}
            onSetDependency={onSetDependency}
            onSetMilestone={onSetMilestone}
            onAddSubtask={onAddSubtask}
            onToggleSubtask={onToggleSubtask}
            onEditSubtask={onEditSubtask}
            onDeleteSubtask={onDeleteSubtask}
            isBatchMode={isBatchMode}
            selectedTasks={selectedTasks}
            onToggleSelection={toggleTaskSelection}
          />

          {doneTasks.length > 0 && (
            <CompletedTaskGroup 
              tasks={doneTasks.map(t => t.name)} 
              isAllComplete={activeTasks.length === 0 && tasks.length > 0}
            />
          )}
        </div>
      )}
    </div>
  );
}

function getPriorityTask(tasks: Task[], guidanceNextStep?: string | null): Task | undefined {
  if (tasks.length === 0) {
    return undefined;
  }

  if (guidanceNextStep) {
    const guidanceMatch = tasks.find(
      (task) => task.name.trim().toLowerCase() === guidanceNextStep.trim().toLowerCase()
    );
    if (guidanceMatch) {
      return guidanceMatch;
    }
  }

  return tasks[0];
}

function getMomentumMessage(phase: DossierPhase, totalTasks: number, completedCount: number): string {
  if (totalTasks === 0) {
    return `Ready to begin work in the ${phase.toLowerCase()} phase. One task will turn the plan into momentum.`;
  }

  if (completedCount === 0) {
    return 'The structure is in place. The next gain comes from completing the first visible task, not from adding more planning.';
  }

  if (completedCount >= totalTasks) {
    return 'All work is complete. This dossier now serves as a record of achievement and a foundation for what comes next.';
  }

  return 'Momentum is visible now. Keep the next task obvious and avoid diluting focus with too many parallel moves.';
}

// Intent-aware panel labels based on phase
function getIntentPanelLabels(phase: DossierPhase) {
  switch (phase) {
    case 'Understanding':
      return {
        sectionLabel: 'Discovery',
        panelTitle: 'Exploration panel',
        description: 'Explore and clarify',
      };
    case 'Structuring':
      return {
        sectionLabel: 'Planning',
        panelTitle: 'Planning panel',
        description: 'Plan and decide',
      };
    case 'Executing':
      return {
        sectionLabel: 'Execution',
        panelTitle: 'Execution panel',
        description: 'Execute and deliver',
      };
    case 'Completed':
      return {
        sectionLabel: 'Completed',
        panelTitle: 'Work record',
        description: 'Review what was done',
      };
    default:
      return {
        sectionLabel: 'Execution',
        panelTitle: 'Execution panel',
        description: 'Keep the execution layer centered on',
      };
  }
}

// Intent-aware color coding for phase
function getIntentPhaseColor(phase: DossierPhase): string {
  switch (phase) {
    case 'Understanding':
      return 'text-[var(--accent-info)]';
    case 'Structuring':
      return 'text-[var(--accent-warning)]';
    case 'Executing':
      return 'text-[var(--text-secondary)]';
    case 'Completed':
      return 'text-[var(--color-green)]';
    default:
      return 'text-[var(--text-secondary)]';
  }
}
