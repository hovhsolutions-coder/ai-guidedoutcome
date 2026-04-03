'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { BlockersCard } from '@/components/dossiers/BlockersCard';
import { DossierHeader } from '@/components/dossiers/DossierHeader';
import { DossierMissionHeader } from '@/components/dossiers/DossierMissionHeader';
import { ExecutionTaskPanel } from '@/components/dossiers/ExecutionTaskPanel';
import { NextStepPanel } from '@/components/dossiers/NextStepPanel';
import { ProgressFrameCard } from '@/components/dossiers/ProgressFrameCard';
import { ActivityHistory } from '@/components/dossiers/ActivityHistory';
import { DossierStructuredContractsPanel } from '@/src/components/dossier';
import { type MockDossier, type DossierPhase, type Task, type ActivityEntry, type ActivityType, type TaskPriority } from '@/lib/mockData';

interface DossierDetailClientProps {
  dossier: MockDossier;
  /** Completed dossiers for cross-dossier reference context in guidance */
  completedDossiers?: Array<{ title: string; main_goal: string; id: string; relevanceScore?: number; outcomeSummary?: string; taskPatterns?: string[] }>;
}

// Small retry utility for transient network failures
interface RetryOptions {
  maxRetries?: number;
  delayMs?: number;
  shouldRetry?: (error: unknown) => boolean;
}

async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 2, delayMs = 500, shouldRetry = isRetryableError } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
    }
  }

  throw lastError;
}

function isRetryableError(error: unknown): boolean {
  // Retry on network errors (no response), timeouts, and 5xx server errors
  if (error instanceof TypeError) {
    // Network errors, fetch failures
    return true;
  }

  if (error instanceof Response) {
    // Retry on 5xx server errors and 429 rate limiting
    return error.status >= 500 || error.status === 429;
  }

  // Check for specific error messages
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('failed to fetch') ||
      message.includes('abort')
    );
  }

  return false;
}

// Persist phase change to the server with retry
async function persistPhaseChange(
  dossierId: string,
  phase: DossierPhase,
  activityHistory: ActivityEntry[]
): Promise<{ success: boolean }> {
  try {
    await withRetry(async () => {
      const response = await fetch(`/api/dossiers/${dossierId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phase,
          lastActivity: `Moved to ${phase} phase`,
          activityHistory,
        }),
      });

      if (!response.ok) {
        // Convert to Response error for retry logic
        if (response.status >= 500 || response.status === 429) {
          throw response;
        }
        console.log(`[dossier:phase:persist:fail] status:${response.status}`);
        return;
      }

      console.log(`[dossier:phase:persist:success] id:${dossierId} phase:${phase}`);
    }, { maxRetries: 2, delayMs: 500 });
    return { success: true };
  } catch (error) {
    console.log(`[dossier:persist:error] ${error instanceof Error ? error.message : 'unknown'}`);
    return { success: false };
  }
}

interface DossierDetailClientProps {
  dossier: MockDossier;
}

interface CurrentObjectiveViewModel {
  title: string;
  focusBadge: string;
  statusLine: string;
  progressLine: string;
}

// Normalize tasks to Task[] format (handle both legacy string[] and new Task[])
function normalizeTasks(rawTasks: (Task | string)[] | undefined): Task[] {
  if (!rawTasks) return [];
  return rawTasks.map((t) => (typeof t === 'string' ? { name: t } : t));
}

// Helper to generate unique IDs for activity entries
function generateActivityId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// Helper to create an activity entry
function createActivityEntry(
  type: ActivityType,
  description: string,
  taskName?: string,
  oldValue?: string,
  newValue?: string
): ActivityEntry {
  return {
    id: generateActivityId(),
    type,
    description,
    timestamp: new Date().toISOString(),
    taskName,
    oldValue,
    newValue,
  };
}

// Persist task changes to the server with retry
async function persistTaskChanges(
  dossierId: string,
  tasks: Task[],
  completedTasks: Set<string>,
  activityHistory: ActivityEntry[]
): Promise<{ success: boolean }> {
  try {
    await withRetry(async () => {
      const completedCount = completedTasks.size;
      const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
      const completedTasksArray = Array.from(completedTasks);
      const response = await fetch(`/api/dossiers/${dossierId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks,
          completedTasks: completedTasksArray,
          progress,
          lastActivity: completedCount > 0 ? 'Task progress updated' : 'Tasks updated',
          activityHistory,
        }),
      });

      if (!response.ok) {
        // Convert to Response error for retry logic
        if (response.status >= 500 || response.status === 429) {
          throw response;
        }
        console.log(`[dossier:persist:fail] status:${response.status}`);
        return;
      }

      console.log(`[dossier:persist:success] id:${dossierId} tasks:${tasks.length} completed:${completedCount}`);
    }, { maxRetries: 2, delayMs: 500 });
    return { success: true };
  } catch (error) {
    console.log(`[dossier:persist:error] ${error instanceof Error ? error.message : 'unknown'}`);
    return { success: false };
  }
}

export function DossierDetailClient({ dossier, completedDossiers = [] }: DossierDetailClientProps) {
  const [tasks, setTasks] = useState<Task[]>(() => normalizeTasks(dossier.tasks));
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(
    () => new Set(dossier.completedTasks || [])
  );
  const [phase, setPhase] = useState<DossierPhase>(dossier.phase);
  const [activityHistory, setActivityHistory] = useState<ActivityEntry[]>(
    () => dossier.activityHistory || []
  );
  const [guidanceNextStep, setGuidanceNextStep] = useState<string | null>(null);
  const [persistError, setPersistError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRetryRef = useRef<{ type: 'tasks' | 'phase'; data: unknown } | null>(null);
  const persistInFlightRef = useRef<boolean>(false);
  const taskPanelRef = useRef<HTMLDivElement>(null);
  const guidancePanelRef = useRef<HTMLDivElement>(null);

  const handleAddTask = useCallback(async (task: string) => {
    // Prevent overlapping persistence operations
    if (persistInFlightRef.current) {
      console.log('[dossier:handleAddTask:dedup] persist in flight, skipping');
      return;
    }
    // Clear any previous error
    setPersistError(null);
    // Sanitize and validate task input
    const sanitized = typeof task === 'string' ? task.trim() : '';
    if (!sanitized || sanitized.length === 0) {
      console.log('[dossier:task:reject] empty_input');
      return;
    }
    if (sanitized.length > 500) {
      console.log(`[dossier:task:reject] oversized length:${sanitized.length}`);
      return;
    }
    const taskExists = tasks.some((t) => t.name === sanitized);
    if (!taskExists) {
      const newTask: Task = { name: sanitized };
      const newTasks = [...tasks, newTask];
      setTasks(newTasks);
      // Record activity for task added
      const newActivity = createActivityEntry('task_added', `Added task "${sanitized}"`, sanitized);
      const newActivityHistory = [...activityHistory, newActivity];
      setActivityHistory(newActivityHistory);
      // Persist task changes asynchronously
      setSaveStatus('saving');
      persistInFlightRef.current = true;
      pendingRetryRef.current = { type: 'tasks', data: { tasks: newTasks, completedTasks } };
      const result = await persistTaskChanges(dossier.id, newTasks, completedTasks, newActivityHistory);
      persistInFlightRef.current = false;
      if (!result.success) {
        setPersistError('Task update could not be saved. Your changes are kept locally—try again shortly.');
        setSaveStatus('idle');
      } else {
        setSaveStatus('saved');
        pendingRetryRef.current = null;
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
      }
    }
  }, [tasks, completedTasks.size, dossier.id, activityHistory]);

  const handleToggleTask = useCallback(async (taskName: string, completed: boolean) => {
    // Prevent overlapping persistence operations
    if (persistInFlightRef.current) {
      console.log('[dossier:handleToggleTask:dedup] persist in flight, skipping');
      return;
    }
    setPersistError(null);
    setSaveStatus('saving');
    
    // Record activity before state update
    const activityType: ActivityType = completed ? 'task_completed' : 'task_uncompleted';
    const newActivity = createActivityEntry(activityType, `${completed ? 'Completed' : 'Reopened'} task "${taskName}"`, taskName);
    const newActivityHistory = [...activityHistory, newActivity];
    setActivityHistory(newActivityHistory);
    
    setCompletedTasks((prev) => {
      const newSet = new Set(prev);
      if (completed) {
        newSet.add(taskName);
      } else {
        newSet.delete(taskName);
      }
      pendingRetryRef.current = { type: 'tasks', data: { tasks, completedTasks: newSet } };
      // Persist after state update with the new completed tasks set
      persistInFlightRef.current = true;
      void persistTaskChanges(dossier.id, tasks, newSet, newActivityHistory).then((result) => {
        persistInFlightRef.current = false;
        if (!result.success) {
          setPersistError('Progress update could not be saved. Your changes are kept locally—try again shortly.');
          setSaveStatus('idle');
        } else {
          setSaveStatus('saved');
          pendingRetryRef.current = null;
          if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
        }
      });
      return newSet;
    });
  }, [tasks, dossier.id, activityHistory]);

  const handleDeleteTask = useCallback(async (taskName: string) => {
    // Prevent overlapping persistence operations
    if (persistInFlightRef.current) {
      console.log('[dossier:handleDeleteTask:dedup] persist in flight, skipping');
      return;
    }
    setPersistError(null);
    setSaveStatus('saving');

    // Remove task from both tasks and completedTasks
    const newTasks = tasks.filter((t) => t.name !== taskName);
    const newCompletedTasks = new Set(completedTasks);
    newCompletedTasks.delete(taskName);

    setTasks(newTasks);
    setCompletedTasks(newCompletedTasks);

    // Record activity for task deleted
    const newActivity = createActivityEntry('task_deleted', `Deleted task "${taskName}"`, taskName);
    const newActivityHistory = [...activityHistory, newActivity];
    setActivityHistory(newActivityHistory);

    pendingRetryRef.current = { type: 'tasks', data: { tasks: newTasks, completedTasks: newCompletedTasks } };
    persistInFlightRef.current = true;

    const result = await persistTaskChanges(dossier.id, newTasks, newCompletedTasks, newActivityHistory);
    persistInFlightRef.current = false;

    if (!result.success) {
      setPersistError('Task deletion could not be saved. Your change is kept locally—try again shortly.');
      setSaveStatus('idle');
    } else {
      setSaveStatus('saved');
      pendingRetryRef.current = null;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    }
  }, [tasks, completedTasks, dossier.id, activityHistory]);

  const handleEditTask = useCallback(async (oldTask: string, newTask: string) => {
    // Prevent overlapping persistence operations
    if (persistInFlightRef.current) {
      console.log('[dossier:handleEditTask:dedup] persist in flight, skipping');
      return;
    }

    // Validate new task name
    const sanitized = typeof newTask === 'string' ? newTask.trim() : '';
    if (!sanitized || sanitized.length === 0) {
      console.log('[dossier:task:reject] empty_edit');
      return;
    }
    if (sanitized.length > 500) {
      console.log(`[dossier:task:reject] oversized length:${sanitized.length}`);
      return;
    }
    if (sanitized === oldTask) {
      // No change, skip
      return;
    }
    const duplicateExists = tasks.some((t) => t.name === sanitized);
    if (duplicateExists) {
      console.log('[dossier:task:reject] duplicate_name');
      return;
    }

    setPersistError(null);
    setSaveStatus('saving');

    // Replace task in tasks array (preserve dueDate if exists)
    const newTasks = tasks.map((t) => (t.name === oldTask ? { ...t, name: sanitized } : t));

    // Update completedTasks set if old task was completed
    const newCompletedTasks = new Set(completedTasks);
    if (newCompletedTasks.has(oldTask)) {
      newCompletedTasks.delete(oldTask);
      newCompletedTasks.add(sanitized);
    }

    setTasks(newTasks);
    setCompletedTasks(newCompletedTasks);

    // Record activity for task renamed
    const newActivity = createActivityEntry('task_renamed', `Renamed task from "${oldTask}" to "${sanitized}"`, sanitized, oldTask, sanitized);
    const newActivityHistory = [...activityHistory, newActivity];
    setActivityHistory(newActivityHistory);

    pendingRetryRef.current = { type: 'tasks', data: { tasks: newTasks, completedTasks: newCompletedTasks } };
    persistInFlightRef.current = true;

    const result = await persistTaskChanges(dossier.id, newTasks, newCompletedTasks, newActivityHistory);
    persistInFlightRef.current = false;

    if (!result.success) {
      setPersistError('Task rename could not be saved. Your change is kept locally—try again shortly.');
      setSaveStatus('idle');
    } else {
      setSaveStatus('saved');
      pendingRetryRef.current = null;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    }
  }, [tasks, completedTasks, dossier.id, activityHistory]);

  const handleReorderTask = useCallback(async (taskName: string, direction: 'up' | 'down') => {
    // Prevent overlapping persistence operations
    if (persistInFlightRef.current) {
      console.log('[dossier:handleReorderTask:dedup] persist in flight, skipping');
      return;
    }

    const currentIndex = tasks.findIndex((t) => t.name === taskName);
    if (currentIndex === -1) return;

    // Check boundaries
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === tasks.length - 1) return;

    setPersistError(null);
    setSaveStatus('saving');

    // Reorder tasks array
    const newTasks = [...tasks];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    // Swap elements
    [newTasks[currentIndex], newTasks[targetIndex]] = [newTasks[targetIndex], newTasks[currentIndex]];

    setTasks(newTasks);
    // completedTasks Set remains unchanged - completion state is preserved

    // Note: Reordering is a silent operation - no activity entry created to keep history clean

    pendingRetryRef.current = { type: 'tasks', data: { tasks: newTasks, completedTasks } };
    persistInFlightRef.current = true;

    const result = await persistTaskChanges(dossier.id, newTasks, completedTasks, activityHistory);
    persistInFlightRef.current = false;

    if (!result.success) {
      setPersistError('Task reorder could not be saved. Your change is kept locally—try again shortly.');
      setSaveStatus('idle');
    } else {
      setSaveStatus('saved');
      pendingRetryRef.current = null;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    }
  }, [tasks, completedTasks, dossier.id, activityHistory]);

  const handleSetDueDate = useCallback(async (taskName: string, dueDate: string | null) => {
    // Prevent overlapping persistence operations
    if (persistInFlightRef.current) {
      console.log('[dossier:handleSetDueDate:dedup] persist in flight, skipping');
      return;
    }

    // Validate date format if provided (YYYY-MM-DD)
    if (dueDate !== null) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dueDate)) {
        console.log('[dossier:duedate:reject] invalid_format');
        return;
      }
      const date = new Date(dueDate);
      if (isNaN(date.getTime())) {
        console.log('[dossier:duedate:reject] invalid_date');
        return;
      }
    }

    setPersistError(null);
    setSaveStatus('saving');

    // Update due date on the task
    const newTasks = tasks.map((t) =>
      t.name === taskName ? { ...t, dueDate: dueDate ?? undefined } : t
    );

    setTasks(newTasks);

    // Record activity for due date change
    const activityType: ActivityType = dueDate ? 'task_due_date_set' : 'task_due_date_cleared';
    const description = dueDate 
      ? `Set due date for "${taskName}" to ${dueDate}` 
      : `Cleared due date for "${taskName}"`;
    const newActivity = createActivityEntry(activityType, description, taskName, undefined, dueDate || undefined);
    const newActivityHistory = [...activityHistory, newActivity];
    setActivityHistory(newActivityHistory);

    pendingRetryRef.current = { type: 'tasks', data: { tasks: newTasks, completedTasks } };
    persistInFlightRef.current = true;

    const result = await persistTaskChanges(dossier.id, newTasks, completedTasks, newActivityHistory);
    persistInFlightRef.current = false;

    if (!result.success) {
      setPersistError('Due date could not be saved. Your change is kept locally—try again shortly.');
      setSaveStatus('idle');
    } else {
      setSaveStatus('saved');
      pendingRetryRef.current = null;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    }
  }, [tasks, completedTasks, dossier.id, activityHistory]);

  const handleSetTaskNote = useCallback(async (taskName: string, notes: string | null) => {
    // Prevent overlapping persistence operations
    if (persistInFlightRef.current) {
      console.log('[dossier:handleSetTaskNote:dedup] persist in flight, skipping');
      return;
    }

    // Validate and sanitize notes
    let sanitizedNotes: string | undefined;
    if (notes !== null) {
      const trimmed = notes.trim();
      if (trimmed.length === 0) {
        sanitizedNotes = undefined;
      } else if (trimmed.length > 1000) {
        sanitizedNotes = trimmed.slice(0, 1000);
      } else {
        sanitizedNotes = trimmed;
      }
    }

    setPersistError(null);
    setSaveStatus('saving');

    // Update notes on the task
    const newTasks = tasks.map((t) =>
      t.name === taskName ? { ...t, notes: sanitizedNotes } : t
    );

    setTasks(newTasks);

    // Record activity for note change
    const activityType: ActivityType = sanitizedNotes ? 'task_note_set' : 'task_note_cleared';
    const description = sanitizedNotes 
      ? `Added note to "${taskName}"` 
      : `Cleared note from "${taskName}"`;
    const newActivity = createActivityEntry(activityType, description, taskName, undefined, sanitizedNotes);
    const newActivityHistory = [...activityHistory, newActivity];
    setActivityHistory(newActivityHistory);

    pendingRetryRef.current = { type: 'tasks', data: { tasks: newTasks, completedTasks } };
    persistInFlightRef.current = true;

    const result = await persistTaskChanges(dossier.id, newTasks, completedTasks, newActivityHistory);
    persistInFlightRef.current = false;

    if (!result.success) {
      setPersistError('Note could not be saved. Your change is kept locally—try again shortly.');
      setSaveStatus('idle');
    } else {
      setSaveStatus('saved');
      pendingRetryRef.current = null;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    }
  }, [tasks, completedTasks, dossier.id, activityHistory]);

  const handleSetPriority = useCallback(async (taskName: string, priority: TaskPriority | null) => {
    // Prevent overlapping persistence operations
    if (persistInFlightRef.current) {
      console.log('[dossier:handleSetPriority:dedup] persist in flight, skipping');
      return;
    }

    // Validate priority value
    if (priority !== null && !['high', 'medium', 'low'].includes(priority)) {
      console.log('[dossier:priority:reject] invalid_priority');
      return;
    }

    setPersistError(null);
    setSaveStatus('saving');

    // Update priority on the task
    const newTasks = tasks.map((t) =>
      t.name === taskName ? { ...t, priority: priority ?? undefined } : t
    );

    setTasks(newTasks);

    // Record activity for priority change
    const activityType: ActivityType = priority ? 'task_priority_set' : 'task_priority_cleared';
    const description = priority 
      ? `Set priority for "${taskName}" to ${priority}` 
      : `Cleared priority from "${taskName}"`;
    const newActivity = createActivityEntry(activityType, description, taskName, undefined, priority || undefined);
    const newActivityHistory = [...activityHistory, newActivity];
    setActivityHistory(newActivityHistory);

    pendingRetryRef.current = { type: 'tasks', data: { tasks: newTasks, completedTasks } };
    persistInFlightRef.current = true;

    const result = await persistTaskChanges(dossier.id, newTasks, completedTasks, newActivityHistory);
    persistInFlightRef.current = false;

    if (!result.success) {
      setPersistError('Priority could not be saved. Your change is kept locally—try again shortly.');
      setSaveStatus('idle');
    } else {
      setSaveStatus('saved');
      pendingRetryRef.current = null;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    }
  }, [tasks, completedTasks, dossier.id, activityHistory]);

  const handleSetCategory = useCallback(async (taskName: string, category: string | null) => {
    if (persistInFlightRef.current) {
      console.log('[dossier:handleSetCategory:dedup] persist in flight, skipping');
      return;
    }

    // Validate category
    if (category !== null) {
      const trimmed = category.trim();
      if (trimmed.length === 0) {
        category = null;
      } else if (trimmed.length > 50) {
        console.log('[dossier:category:reject] too_long');
        return;
      } else {
        category = trimmed;
      }
    }

    setPersistError(null);
    setSaveStatus('saving');

    const newTasks = tasks.map((t) =>
      t.name === taskName ? { ...t, category: category ?? undefined } : t
    );

    setTasks(newTasks);

    // Record activity for category change
    const activityType: ActivityType = category ? 'task_category_set' : 'task_category_cleared';
    const description = category
      ? `Set category for "${taskName}" to "${category}"`
      : `Cleared category from "${taskName}"`;
    const newActivity = createActivityEntry(activityType, description, taskName, undefined, category || undefined);
    const newActivityHistory = [...activityHistory, newActivity];
    setActivityHistory(newActivityHistory);

    pendingRetryRef.current = { type: 'tasks', data: { tasks: newTasks, completedTasks } };
    persistInFlightRef.current = true;

    const result = await persistTaskChanges(dossier.id, newTasks, completedTasks, newActivityHistory);
    persistInFlightRef.current = false;

    if (!result.success) {
      setPersistError('Category could not be saved. Your change is kept locally—try again shortly.');
      setSaveStatus('idle');
    } else {
      setSaveStatus('saved');
      pendingRetryRef.current = null;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    }
  }, [tasks, completedTasks, dossier.id, activityHistory]);

  const handleSetEstimate = useCallback(async (taskName: string, estimate: string | null) => {
    if (persistInFlightRef.current) {
      console.log('[dossier:handleSetEstimate:dedup] persist in flight, skipping');
      return;
    }

    // Validate estimate
    if (estimate !== null) {
      const trimmed = estimate.trim();
      if (trimmed.length === 0) {
        estimate = null;
      } else if (trimmed.length > 20) {
        console.log('[dossier:estimate:reject] too_long');
        return;
      } else {
        estimate = trimmed;
      }
    }

    setPersistError(null);
    setSaveStatus('saving');

    const newTasks = tasks.map((t) =>
      t.name === taskName ? { ...t, estimate: estimate ?? undefined } : t
    );

    setTasks(newTasks);

    // Record activity for estimate change
    const activityType: ActivityType = estimate ? 'task_estimate_set' : 'task_estimate_cleared';
    const description = estimate
      ? `Set estimate for "${taskName}" to "${estimate}"`
      : `Cleared estimate from "${taskName}"`;
    const newActivity = createActivityEntry(activityType, description, taskName, undefined, estimate || undefined);
    const newActivityHistory = [...activityHistory, newActivity];
    setActivityHistory(newActivityHistory);

    pendingRetryRef.current = { type: 'tasks', data: { tasks: newTasks, completedTasks } };
    persistInFlightRef.current = true;

    const result = await persistTaskChanges(dossier.id, newTasks, completedTasks, newActivityHistory);
    persistInFlightRef.current = false;

    if (!result.success) {
      setPersistError('Estimate could not be saved. Your change is kept locally—try again shortly.');
      setSaveStatus('idle');
    } else {
      setSaveStatus('saved');
      pendingRetryRef.current = null;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    }
  }, [tasks, completedTasks, dossier.id, activityHistory]);

  const handleToggleTimeTracking = useCallback(async (taskName: string) => {
    if (persistInFlightRef.current) {
      console.log('[dossier:handleToggleTimeTracking:dedup] persist in flight, skipping');
      return;
    }

    const task = tasks.find((t) => t.name === taskName);
    if (!task) return;

    const isTracking = task.isTracking ?? false;
    const actualTime = task.actualTime ?? 0;
    const now = new Date().toISOString();

    setPersistError(null);
    setSaveStatus('saving');

    let newActualTime = actualTime;
    if (isTracking && task.trackingStartedAt) {
      // Stop tracking - calculate elapsed time
      const started = new Date(task.trackingStartedAt);
      const elapsed = Math.floor((new Date(now).getTime() - started.getTime()) / 60000);
      newActualTime = Math.max(0, actualTime + elapsed);
    }

    const newTasks = tasks.map((t) =>
      t.name === taskName
        ? {
            ...t,
            isTracking: !isTracking,
            trackingStartedAt: !isTracking ? now : undefined,
            actualTime: isTracking ? newActualTime : t.actualTime,
          }
        : t
    );

    setTasks(newTasks);

    // Record activity for tracking start/stop
    const activityType: ActivityType = isTracking ? 'task_tracking_stopped' : 'task_tracking_started';
    const description = isTracking
      ? `Stopped tracking time for "${taskName}"`
      : `Started tracking time for "${taskName}"`;
    const newActivity = createActivityEntry(activityType, description, taskName);
    const newActivityHistory = [...activityHistory, newActivity];
    setActivityHistory(newActivityHistory);

    pendingRetryRef.current = { type: 'tasks', data: { tasks: newTasks, completedTasks } };
    persistInFlightRef.current = true;

    const result = await persistTaskChanges(dossier.id, newTasks, completedTasks, newActivityHistory);
    persistInFlightRef.current = false;

    if (!result.success) {
      setPersistError('Time tracking could not be saved. Your change is kept locally—try again shortly.');
      setSaveStatus('idle');
    } else {
      setSaveStatus('saved');
      pendingRetryRef.current = null;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    }
  }, [tasks, completedTasks, dossier.id, activityHistory]);

  const handleSetDependency = useCallback(async (taskName: string, dependency: string | null) => {
    if (persistInFlightRef.current) {
      console.log('[dossier:handleSetDependency:dedup] persist in flight, skipping');
      return;
    }

    const task = tasks.find((t) => t.name === taskName);
    if (!task) return;

    // Validate: prevent self-dependency
    if (dependency && dependency === taskName) {
      console.log('[dossier:handleSetDependency:invalid] cannot depend on self');
      return;
    }

    // Validate: dependency must reference an existing task
    if (dependency && !tasks.find((t) => t.name === dependency)) {
      console.log('[dossier:handleSetDependency:invalid] dependency task not found');
      return;
    }

    setPersistError(null);
    setSaveStatus('saving');

    const currentDeps = task.dependencies || [];
    let newDeps: string[];
    let activityType: ActivityType;
    let description: string;

    if (dependency) {
      // Adding a dependency
      if (currentDeps.includes(dependency)) {
        console.log('[dossier:handleSetDependency:duplicate] dependency already exists');
        setSaveStatus('idle');
        return;
      }
      newDeps = [...currentDeps, dependency];
      activityType = 'task_dependency_added';
      description = `Added dependency on "${dependency}" for "${taskName}"`;
    } else {
      // Removing all dependencies (null means clear)
      if (currentDeps.length === 0) {
        console.log('[dossier:handleSetDependency:noop] no dependencies to remove');
        setSaveStatus('idle');
        return;
      }
      newDeps = [];
      activityType = 'task_dependency_removed';
      description = `Removed dependencies from "${taskName}"`;
    }

    const newTasks = tasks.map((t) =>
      t.name === taskName ? { ...t, dependencies: newDeps } : t
    );

    setTasks(newTasks);

    // Record activity
    const newActivity = createActivityEntry(activityType, description, taskName);
    const newActivityHistory = [...activityHistory, newActivity];
    setActivityHistory(newActivityHistory);

    pendingRetryRef.current = { type: 'tasks', data: { tasks: newTasks, completedTasks } };
    persistInFlightRef.current = true;

    const result = await persistTaskChanges(dossier.id, newTasks, completedTasks, newActivityHistory);
    persistInFlightRef.current = false;

    if (!result.success) {
      setPersistError('Dependency change could not be saved. Your change is kept locally—try again shortly.');
      setSaveStatus('idle');
    } else {
      setSaveStatus('saved');
      pendingRetryRef.current = null;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    }
  }, [tasks, completedTasks, dossier.id, activityHistory]);

  const handleSetMilestone = useCallback(async (taskName: string, milestone: string | null) => {
    if (persistInFlightRef.current) {
      console.log('[dossier:handleSetMilestone:dedup] persist in flight, skipping');
      return;
    }

    const task = tasks.find((t) => t.name === taskName);
    if (!task) return;

    // Validate milestone (non-empty when saved, bounded length)
    const trimmedMilestone = milestone?.trim();
    if (milestone && (!trimmedMilestone || trimmedMilestone.length > 30)) {
      console.log('[dossier:handleSetMilestone:invalid] milestone too long or empty');
      return;
    }

    setPersistError(null);
    setSaveStatus('saving');

    const newTasks = tasks.map((t) =>
      t.name === taskName ? { ...t, milestone: trimmedMilestone || undefined } : t
    );

    setTasks(newTasks);

    // Record activity
    const activityType: ActivityType = milestone ? 'task_milestone_set' : 'task_milestone_cleared';
    const description = milestone
      ? `Set milestone "${trimmedMilestone}" for "${taskName}"`
      : `Cleared milestone from "${taskName}"`;
    const newActivity = createActivityEntry(activityType, description, taskName);
    const newActivityHistory = [...activityHistory, newActivity];
    setActivityHistory(newActivityHistory);

    pendingRetryRef.current = { type: 'tasks', data: { tasks: newTasks, completedTasks } };
    persistInFlightRef.current = true;

    const result = await persistTaskChanges(dossier.id, newTasks, completedTasks, newActivityHistory);
    persistInFlightRef.current = false;

    if (!result.success) {
      setPersistError('Milestone change could not be saved. Your change is kept locally—try again shortly.');
      setSaveStatus('idle');
    } else {
      setSaveStatus('saved');
      pendingRetryRef.current = null;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    }
  }, [tasks, completedTasks, dossier.id, activityHistory]);

  // Subtask handlers
  const handleAddSubtask = useCallback(async (taskName: string, subtaskName: string) => {
    if (persistInFlightRef.current) {
      console.log('[dossier:handleAddSubtask:dedup] persist in flight, skipping');
      return;
    }

    const trimmed = subtaskName.trim();
    if (!trimmed || trimmed.length > 100) return;

    setPersistError(null);
    setSaveStatus('saving');

    const newSubtask = { id: crypto.randomUUID(), name: trimmed, completed: false };
    const newTasks = tasks.map((t) =>
      t.name === taskName
        ? { ...t, subtasks: [...(t.subtasks || []), newSubtask] }
        : t
    );

    setTasks(newTasks);

    const description = `Added subtask "${trimmed}" to "${taskName}"`;
    const newActivity = createActivityEntry('subtask_added', description, taskName);
    const newActivityHistory = [...activityHistory, newActivity];
    setActivityHistory(newActivityHistory);

    pendingRetryRef.current = { type: 'tasks', data: { tasks: newTasks, completedTasks } };
    persistInFlightRef.current = true;

    const result = await persistTaskChanges(dossier.id, newTasks, completedTasks, newActivityHistory);
    persistInFlightRef.current = false;

    if (!result.success) {
      setPersistError('Subtask could not be saved. Your change is kept locally—try again shortly.');
      setSaveStatus('idle');
    } else {
      setSaveStatus('saved');
      pendingRetryRef.current = null;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    }
  }, [tasks, completedTasks, dossier.id, activityHistory]);

  const handleToggleSubtask = useCallback(async (taskName: string, subtaskId: string) => {
    if (persistInFlightRef.current) {
      console.log('[dossier:handleToggleSubtask:dedup] persist in flight, skipping');
      return;
    }

    const task = tasks.find((t) => t.name === taskName);
    if (!task) return;

    const subtask = task.subtasks?.find((s) => s.id === subtaskId);
    if (!subtask) return;

    setPersistError(null);
    setSaveStatus('saving');

    const newSubtasks = task.subtasks?.map((s) =>
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );

    const newTasks = tasks.map((t) =>
      t.name === taskName ? { ...t, subtasks: newSubtasks } : t
    );

    setTasks(newTasks);

    const activityType: ActivityType = subtask.completed ? 'subtask_uncompleted' : 'subtask_completed';
    const description = subtask.completed
      ? `Uncompleted subtask "${subtask.name}" in "${taskName}"`
      : `Completed subtask "${subtask.name}" in "${taskName}"`;
    const newActivity = createActivityEntry(activityType, description, taskName);
    const newActivityHistory = [...activityHistory, newActivity];
    setActivityHistory(newActivityHistory);

    pendingRetryRef.current = { type: 'tasks', data: { tasks: newTasks, completedTasks } };
    persistInFlightRef.current = true;

    const result = await persistTaskChanges(dossier.id, newTasks, completedTasks, newActivityHistory);
    persistInFlightRef.current = false;

    if (!result.success) {
      setPersistError('Subtask status could not be saved. Your change is kept locally—try again shortly.');
      setSaveStatus('idle');
    } else {
      setSaveStatus('saved');
      pendingRetryRef.current = null;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    }
  }, [tasks, completedTasks, dossier.id, activityHistory]);

  const handleEditSubtask = useCallback(async (taskName: string, subtaskId: string, newName: string) => {
    if (persistInFlightRef.current) {
      console.log('[dossier:handleEditSubtask:dedup] persist in flight, skipping');
      return;
    }

    const trimmed = newName.trim();
    if (!trimmed || trimmed.length > 100) return;

    const task = tasks.find((t) => t.name === taskName);
    if (!task) return;

    const subtask = task.subtasks?.find((s) => s.id === subtaskId);
    if (!subtask || subtask.name === trimmed) return;

    setPersistError(null);
    setSaveStatus('saving');

    const newSubtasks = task.subtasks?.map((s) =>
      s.id === subtaskId ? { ...s, name: trimmed } : s
    );

    const newTasks = tasks.map((t) =>
      t.name === taskName ? { ...t, subtasks: newSubtasks } : t
    );

    setTasks(newTasks);

    const description = `Edited subtask "${subtask.name}" to "${trimmed}" in "${taskName}"`;
    const newActivity = createActivityEntry('subtask_edited', description, taskName);
    const newActivityHistory = [...activityHistory, newActivity];
    setActivityHistory(newActivityHistory);

    pendingRetryRef.current = { type: 'tasks', data: { tasks: newTasks, completedTasks } };
    persistInFlightRef.current = true;

    const result = await persistTaskChanges(dossier.id, newTasks, completedTasks, newActivityHistory);
    persistInFlightRef.current = false;

    if (!result.success) {
      setPersistError('Subtask edit could not be saved. Your change is kept locally—try again shortly.');
      setSaveStatus('idle');
    } else {
      setSaveStatus('saved');
      pendingRetryRef.current = null;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    }
  }, [tasks, completedTasks, dossier.id, activityHistory]);

  const handleDeleteSubtask = useCallback(async (taskName: string, subtaskId: string) => {
    if (persistInFlightRef.current) {
      console.log('[dossier:handleDeleteSubtask:dedup] persist in flight, skipping');
      return;
    }

    const task = tasks.find((t) => t.name === taskName);
    if (!task) return;

    const subtask = task.subtasks?.find((s) => s.id === subtaskId);
    if (!subtask) return;

    setPersistError(null);
    setSaveStatus('saving');

    const newSubtasks = task.subtasks?.filter((s) => s.id !== subtaskId);

    const newTasks = tasks.map((t) =>
      t.name === taskName ? { ...t, subtasks: newSubtasks } : t
    );

    setTasks(newTasks);

    const description = `Deleted subtask "${subtask.name}" from "${taskName}"`;
    const newActivity = createActivityEntry('subtask_deleted', description, taskName);
    const newActivityHistory = [...activityHistory, newActivity];
    setActivityHistory(newActivityHistory);

    pendingRetryRef.current = { type: 'tasks', data: { tasks: newTasks, completedTasks } };
    persistInFlightRef.current = true;

    const result = await persistTaskChanges(dossier.id, newTasks, completedTasks, newActivityHistory);
    persistInFlightRef.current = false;

    if (!result.success) {
      setPersistError('Subtask deletion could not be saved. Your change is kept locally—try again shortly.');
      setSaveStatus('idle');
    } else {
      setSaveStatus('saved');
      pendingRetryRef.current = null;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    }
  }, [tasks, completedTasks, dossier.id, activityHistory]);

  const handleBatchComplete = useCallback(async (taskNames: string[]) => {
    if (persistInFlightRef.current) {
      console.log('[dossier:handleBatchComplete:dedup] persist in flight, skipping');
      return;
    }

    setPersistError(null);
    setSaveStatus('saving');

    const newCompletedTasks = new Set(completedTasks);
    taskNames.forEach((name) => newCompletedTasks.add(name));

    // Record activity for batch complete
    const newActivity = createActivityEntry(
      'task_completed',
      `Completed ${taskNames.length} task${taskNames.length > 1 ? 's' : ''}`,
      undefined,
      undefined,
      undefined
    );
    newActivity.batchCount = taskNames.length;
    const newActivityHistory = [...activityHistory, newActivity];
    setActivityHistory(newActivityHistory);

    pendingRetryRef.current = { type: 'tasks', data: { tasks, completedTasks: newCompletedTasks } };
    persistInFlightRef.current = true;

    const result = await persistTaskChanges(dossier.id, tasks, newCompletedTasks, newActivityHistory);
    persistInFlightRef.current = false;

    if (!result.success) {
      setPersistError('Batch complete could not be saved. Changes are kept locally—try again shortly.');
      setSaveStatus('idle');
    } else {
      setSaveStatus('saved');
      pendingRetryRef.current = null;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    }
  }, [tasks, completedTasks, dossier.id, activityHistory]);

  const handleBatchUncomplete = useCallback(async (taskNames: string[]) => {
    if (persistInFlightRef.current) {
      console.log('[dossier:handleBatchUncomplete:dedup] persist in flight, skipping');
      return;
    }

    setPersistError(null);
    setSaveStatus('saving');

    const newCompletedTasks = new Set(completedTasks);
    taskNames.forEach((name) => newCompletedTasks.delete(name));

    // Record activity for batch uncomplete
    const newActivity = createActivityEntry(
      'task_uncompleted',
      `Uncompleted ${taskNames.length} task${taskNames.length > 1 ? 's' : ''}`,
      undefined,
      undefined,
      undefined
    );
    newActivity.batchCount = taskNames.length;
    const newActivityHistory = [...activityHistory, newActivity];
    setActivityHistory(newActivityHistory);

    pendingRetryRef.current = { type: 'tasks', data: { tasks, completedTasks: newCompletedTasks } };
    persistInFlightRef.current = true;

    const result = await persistTaskChanges(dossier.id, tasks, newCompletedTasks, newActivityHistory);
    persistInFlightRef.current = false;

    if (!result.success) {
      setPersistError('Batch uncomplete could not be saved. Changes are kept locally—try again shortly.');
      setSaveStatus('idle');
    } else {
      setSaveStatus('saved');
      pendingRetryRef.current = null;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    }
  }, [tasks, completedTasks, dossier.id, activityHistory]);

  const handleBatchDelete = useCallback(async (taskNames: string[]) => {
    if (persistInFlightRef.current) {
      console.log('[dossier:handleBatchDelete:dedup] persist in flight, skipping');
      return;
    }

    setPersistError(null);
    setSaveStatus('saving');

    const namesToDelete = new Set(taskNames);
    const newTasks = tasks.filter((t) => !namesToDelete.has(t.name));
    const newCompletedTasks = new Set(
      Array.from(completedTasks).filter((name) => !namesToDelete.has(name))
    );

    setTasks(newTasks);

    // Record activity for batch delete
    const newActivity = createActivityEntry(
      'task_deleted',
      `Deleted ${taskNames.length} task${taskNames.length > 1 ? 's' : ''}`,
      undefined,
      undefined,
      undefined
    );
    newActivity.batchCount = taskNames.length;
    const newActivityHistory = [...activityHistory, newActivity];
    setActivityHistory(newActivityHistory);

    pendingRetryRef.current = { type: 'tasks', data: { tasks: newTasks, completedTasks: newCompletedTasks } };
    persistInFlightRef.current = true;

    const result = await persistTaskChanges(dossier.id, newTasks, newCompletedTasks, newActivityHistory);
    persistInFlightRef.current = false;

    if (!result.success) {
      setPersistError('Batch delete could not be saved. Changes are kept locally—try again shortly.');
      setSaveStatus('idle');
    } else {
      setSaveStatus('saved');
      pendingRetryRef.current = null;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    }
  }, [tasks, completedTasks, dossier.id, activityHistory]);

  const completedCount = completedTasks.size;
  const hasTasks = tasks.length > 0;
  const hasCompletedTasks = completedCount > 0;

  const missionSentence = getMissionSentence({ ...dossier, phase });
  const nextStepSummary = getNextStepSummary(hasTasks, hasCompletedTasks, phase);
  const primaryCtaLabel = getPrimaryCtaLabel(hasTasks, hasCompletedTasks, phase);
  const progressNarrative = getProgressNarrative(phase, tasks.length, completedCount);
  const blockerState = getBlockerState(hasTasks, hasCompletedTasks, phase);
  const currentObjective = getCurrentObjective({
    phase,
    tasks,
    completedCount,
    guidanceNextStep,
    fallbackNextStep: nextStepSummary,
  });

  const handlePhaseChange = useCallback(async (newPhase: DossierPhase) => {
    setPersistError(null);
    setSaveStatus('saving');
    setPhase(newPhase);
    
    // Record activity for phase change
    const newActivity = createActivityEntry('phase_changed', `Moved to ${newPhase} phase`, undefined, phase, newPhase);
    const newActivityHistory = [...activityHistory, newActivity];
    setActivityHistory(newActivityHistory);
    
    pendingRetryRef.current = { type: 'phase', data: { phase: newPhase } };
    const result = await persistPhaseChange(dossier.id, newPhase, newActivityHistory);
    if (!result.success) {
      setPersistError('Phase change could not be saved. Your change is kept locally—try again shortly.');
      setSaveStatus('idle');
    } else {
      setSaveStatus('saved');
      pendingRetryRef.current = null;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    }
  }, [dossier.id, phase, activityHistory]);

  /** Close out the dossier by moving it to the Completed phase */
  const handleCloseOutDossier = useCallback(() => {
    void handlePhaseChange('Completed');
  }, [handlePhaseChange]);

  const scrollToTasks = () => {
    taskPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToGuidance = () => {
    guidancePanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handlePrimaryAction = () => {
    if (!hasTasks) {
      scrollToGuidance();
      return;
    }

    scrollToTasks();
  };

  // Retry pending operations when user re-engages (tab focus/visibility)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && pendingRetryRef.current) {
        const pending = pendingRetryRef.current;
        console.log(`[dossier:retry:on_reengage] type:${pending.type}`);
        setPersistError(null);
        setSaveStatus('saving');

        if (pending.type === 'tasks') {
          const { tasks: pendingTasks, completedTasks: pendingCompleted } = pending.data as { tasks: Task[]; completedTasks: Set<string> };
          void persistTaskChanges(dossier.id, pendingTasks, pendingCompleted, activityHistory).then((result) => {
            if (result.success) {
              console.log('[dossier:retry:success] tasks');
              pendingRetryRef.current = null;
              setSaveStatus('saved');
              if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
              saveTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
            } else {
              console.log('[dossier:retry:failed] tasks');
              setSaveStatus('idle');
            }
          });
        } else if (pending.type === 'phase') {
          const { phase: pendingPhase } = pending.data as { phase: DossierPhase };
          void persistPhaseChange(dossier.id, pendingPhase, activityHistory).then((result) => {
            if (result.success) {
              console.log('[dossier:retry:success] phase');
              pendingRetryRef.current = null;
              setSaveStatus('saved');
              if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
              saveTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
            } else {
              console.log('[dossier:retry:failed] phase');
              setSaveStatus('idle');
            }
          });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [dossier.id]);

  // Track online/offline state for connection awareness
  useEffect(() => {
    const handleOnline = () => {
      console.log('[dossier:connection:online]');
      setIsOnline(true);
      setPersistError(null);
    };
    const handleOffline = () => {
      console.log('[dossier:connection:offline]');
      setIsOnline(false);
    };

    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div data-testid="dossier-detail" className="space-y-8">
      <div className="flex items-center justify-between">
        <Link
          href="/dossiers"
          className="ui-button-ghost inline-flex min-h-0 items-center gap-2 px-0 py-0 text-[var(--accent-primary-strong)] hover:bg-transparent"
        >
          Back to Dossier Queue
        </Link>
        {saveStatus !== 'idle' && (
          <div className="flex items-center gap-2 text-[11px] text-[var(--text-tertiary)]">
            {saveStatus === 'saving' && (
              <>
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[var(--text-tertiary)] border-t-transparent" />
                <span>Saving...</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <span className="text-[var(--color-green)]">✓</span>
                <span className="text-[var(--color-green)]">Saved</span>
              </>
            )}
          </div>
        )}
        {!isOnline && (
          <div className="flex items-center gap-2 text-[11px] text-[var(--color-red)] px-2 py-1 rounded bg-[rgba(255,107,107,0.1)]">
            <span>●</span>
            <span>Offline</span>
          </div>
        )}
      </div>

      {persistError && (
        <div className="ui-surface-secondary border border-[rgba(255,107,107,0.4)] px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-[var(--color-red)]">⚠</span>
            <p className="text-sm text-[var(--text-secondary)]">{persistError}</p>
            <button
              onClick={() => setPersistError(null)}
              className="ml-auto text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <section className="ui-surface-primary relative overflow-hidden px-6 py-6 shadow-[0_32px_90px_rgba(5,9,16,0.36)] sm:px-8 sm:py-8">
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(131,174,255,0.85),transparent)]" />
        <div className="space-y-8">
          <DossierMissionHeader title={dossier.title} phase={phase} mission={missionSentence} onPhaseChange={handlePhaseChange} />

          <div className="ui-surface-secondary border border-[var(--border-subtle)] p-5 rounded-[18px] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                Grounded in your intake
              </p>
              <div className="text-sm text-[var(--text-primary)]">
                <span className="font-semibold">Situation:</span> {dossier.situation || 'Not yet captured'}
              </div>
              <div className="text-sm text-[var(--text-primary)]">
                <span className="font-semibold">Goal:</span> {dossier.main_goal || 'Add a clear goal to guide execution'}
              </div>
            </div>
            <div className="sm:text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-primary-strong)]">
                First move
              </p>
              <p className="text-sm text-[var(--text-primary)]">{currentObjective.title}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_0.75fr_0.75fr]">
            <NextStepPanel
              nextStep={currentObjective.title}
              focusBadge={currentObjective.focusBadge}
              statusLine={currentObjective.statusLine}
              primaryCtaLabel={primaryCtaLabel}
              onPrimaryAction={handlePrimaryAction}
              onReviewTasks={scrollToTasks}
            />
            <ProgressFrameCard
              phase={phase}
              totalTasks={tasks.length}
              completedTasks={completedCount}
              currentObjective={currentObjective.title}
              focusBadge={currentObjective.focusBadge}
              progressNarrative={currentObjective.progressLine || progressNarrative}
            />
            {blockerState && phase !== 'Completed' ? (
              <BlockersCard title={blockerState.title} description={blockerState.description} />
            ) : blockerState && phase === 'Completed' ? null : (
              <div className="ui-surface-secondary h-full p-5">
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-primary-strong)]">
                    Momentum signal
                  </p>
                  <h2 className="text-xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
                    Momentum is holding
                  </h2>
                  <p className="text-sm leading-6 text-[var(--text-secondary)]">
                    Keep the current objective tight. The next gain will likely come from finishing one more meaningful task before expanding scope.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <div className="ui-surface-primary p-8">
            <DossierHeader dossier={dossier} />
          </div>
          <div ref={taskPanelRef} className="ui-surface-primary p-6">
            <ExecutionTaskPanel
              tasks={tasks}
              completedTasks={completedTasks}
              onToggleTask={handleToggleTask}
              onDeleteTask={handleDeleteTask}
              onEditTask={handleEditTask}
              onReorderTask={handleReorderTask}
              onSetDueDate={handleSetDueDate}
              onSetTaskNote={handleSetTaskNote}
              onSetPriority={handleSetPriority}
              onSetCategory={handleSetCategory}
              onSetEstimate={handleSetEstimate}
              onToggleTimeTracking={handleToggleTimeTracking}
              onSetDependency={handleSetDependency}
              onSetMilestone={handleSetMilestone}
              onAddSubtask={handleAddSubtask}
              onToggleSubtask={handleToggleSubtask}
              onEditSubtask={handleEditSubtask}
              onDeleteSubtask={handleDeleteSubtask}
              onBatchComplete={handleBatchComplete}
              onBatchUncomplete={handleBatchUncomplete}
              onBatchDelete={handleBatchDelete}
              onCloseOutDossier={handleCloseOutDossier}
              phase={dossier.phase}
              guidanceNextStep={guidanceNextStep}
              currentObjective={currentObjective.title}
              focusBadge={currentObjective.focusBadge}
              statusLine={currentObjective.statusLine}
            />
          </div>
          <ActivityHistory 
            activities={activityHistory} 
            maxDisplay={10} 
            completedCount={completedCount}
            totalTasks={tasks.length}
          />
          {(dossier.narrative || dossier.systemPlan || dossier.executionPlan) && (
            <div className="ui-surface-primary p-6">
              <DossierStructuredContractsPanel
                narrative={dossier.narrative}
                systemPlan={dossier.systemPlan}
                executionPlan={dossier.executionPlan}
              />
            </div>
          )}
        </div>

        <div ref={guidancePanelRef} className="lg:col-span-2">
          <ChatPanel
            dossier={{ ...dossier, phase, tasks }}
            onAddTask={handleAddTask}
            completedTasks={completedTasks}
            totalTasks={tasks.length}
            onTaskCompleted={(task, completed) => handleToggleTask(task, completed)}
            onGuidanceChange={(guidance) => setGuidanceNextStep(guidance?.next_step ?? null)}
            currentObjective={{
              title: currentObjective.title,
              focusBadge: currentObjective.focusBadge,
              statusLine: currentObjective.statusLine,
            }}
            completedDossiers={completedDossiers}
          />
        </div>
      </div>
    </div>
  );
}

function getMissionSentence(dossier: MockDossier): string {
  switch (dossier.phase) {
    case 'Understanding':
      return `Clarify the situation around ${dossier.main_goal.toLowerCase()} and turn uncertainty into a focused starting point.`;
    case 'Structuring':
      return `Shape the work into a clear plan so ${dossier.main_goal.toLowerCase()} becomes easier to execute with confidence.`;
    case 'Executing':
      return `Keep execution tight, remove friction quickly, and move ${dossier.main_goal.toLowerCase()} toward a concrete result.`;
    case 'Completed':
      return `${dossier.main_goal} has been successfully completed. Review outcomes and capture learnings.`;
    default:
      return `Continue working toward ${dossier.main_goal.toLowerCase()}.`;
  }
}

function getNextStepSummary(hasTasks: boolean, hasCompletedTasks: boolean, phase: MockDossier['phase']): string {
  if (!hasTasks) {
    return 'Add your first task to begin execution.';
  }

  if (!hasCompletedTasks) {
    return 'Complete the first task to unlock momentum and prove progress is possible.';
  }

  if (phase === 'Executing') {
    return 'Continue the momentum—finish the next task before adding new complexity.';
  }

  if (phase === 'Structuring') {
    return 'Use your progress to validate the plan and move the next task forward.';
  }

  return 'Build on completed work and convert the next insight into immediate action.';
}

export function getPrimaryCtaLabel(hasTasks: boolean, hasCompletedTasks: boolean, phase: MockDossier['phase']): string {
  if (phase === 'Completed') {
    return 'Review record';
  }

  if (!hasTasks) {
    return 'Define first action';
  }

  if (!hasCompletedTasks) {
    return 'Start now';
  }

  return 'Keep going';
}

function getProgressNarrative(
  phase: MockDossier['phase'],
  totalTasks: number,
  completedCount: number
): string {
  if (totalTasks === 0) {
    return `You are in the ${phase.toLowerCase()} phase. Add your first task to begin building momentum.`;
  }

  if (completedCount === 0) {
    return `You have ${totalTasks} task${totalTasks === 1 ? '' : 's'} ready. Complete the first one to turn planning into progress.`;
  }

  const remainingCount = Math.max(totalTasks - completedCount, 0);
  const percentage = Math.round((completedCount / totalTasks) * 100);

  // Finishing phase - 75%+ complete
  if (percentage >= 75) {
    return `You are ${percentage}% complete with only ${remainingCount} task${remainingCount === 1 ? '' : 's'} remaining. Push through to finish strong.`;
  }

  // Momentum phase - some progress made
  if (completedCount >= 2) {
    return `Strong progress: ${completedCount} of ${totalTasks} tasks complete. Keep the momentum going with the remaining ${remainingCount}.`;
  }

  // Early momentum - first completion
  return `First task complete! You have ${remainingCount} more to go. Keep this pace to build steady progress.`;
}

function getBlockerState(
  hasTasks: boolean,
  hasCompletedTasks: boolean,
  phase: MockDossier['phase']
): { title: string; description: string } | null {
  if (!hasTasks) {
    return {
      title: 'Define your first action',
      description: `Add one concrete task to move from ${phase.toLowerCase()} into execution. One step is all it takes to start.`,
    };
  }

  if (!hasCompletedTasks) {
    return {
      title: 'Complete your first task',
      description: 'The plan is set. Complete one task to prove progress is possible and unlock momentum.',
    };
  }

  return null;
}

export function getThirdSlotContent(
  blockerState: { title: string; description: string } | null,
  phase: MockDossier['phase']
): 'blocker' | 'momentum' | null {
  if (blockerState) {
    return 'blocker';
  }
  if (phase === 'Completed') {
    return null;
  }
  return 'momentum';
}

export function getCurrentObjective({
  phase,
  tasks,
  completedCount,
  guidanceNextStep,
  fallbackNextStep,
}: {
  phase: MockDossier['phase'];
  tasks: Task[];
  completedCount: number;
  guidanceNextStep: string | null;
  fallbackNextStep: string;
}): CurrentObjectiveViewModel {
  const normalizedGuidance = guidanceNextStep?.trim().toLowerCase();
  const openTasks = tasks.filter((t) => !!t.name).map((t) => t.name);
  const alignedTask = normalizedGuidance
    ? openTasks.find((task) => task.trim().toLowerCase() === normalizedGuidance)
    : undefined;
  const title = alignedTask ?? guidanceNextStep ?? openTasks[0] ?? fallbackNextStep;

  // Completed phase - work is finished, show reference state
  if (phase === 'Completed') {
    return {
      title,
      focusBadge: 'Review record',
      statusLine: 'All work completed. Review the record below to capture outcomes or reference for future work.',
      progressLine: 'This dossier is now a completed reference. Browse tasks, activity history, and outcomes.',
    };
  }

  if (openTasks.length === 0) {
    return {
      title,
      focusBadge: 'Start here',
      statusLine: 'No tasks yet. Add one concrete action below to begin execution.',
      progressLine: 'The workspace is ready. One task will turn this from planning into progress.',
    };
  }

  if (completedCount === 0) {
    return {
      title,
      focusBadge: 'Primary focus',
      statusLine: 'Keep every major surface pointed at this same objective until the first visible win is completed.',
      progressLine: `You have a task structure in place. Real progress now means advancing this single objective before expanding scope.`,
    };
  }

  return {
    title,
    focusBadge: 'Momentum focus',
    statusLine: 'Momentum exists now. Keep this objective as the shared focus until the next meaningful gain is secured.',
    progressLine: `Completed work is already creating traction. Use the remaining effort to keep this objective moving cleanly through the ${phase.toLowerCase()} phase.`,
  };
}
