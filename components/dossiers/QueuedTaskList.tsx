import React from 'react';
import { cn } from '@/lib/utils';
import { type Task, type TaskPriority } from '@/lib/mockData';

interface QueuedTaskItemProps {
  task: Task;
  index: number;
  isGuidanceAligned: boolean;
  isBlocked: boolean;
  isReadyToStart: boolean;
  isSecondary: boolean;
  onToggleTask: (taskName: string) => void;
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
  allTasks?: Task[];
  isFirst: boolean;
  isLast: boolean;
  isBatchMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: () => void;
}

function QueuedTaskItem({
  task,
  index,
  isGuidanceAligned,
  isBlocked,
  isReadyToStart,
  isSecondary,
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
  allTasks,
  isFirst,
  isLast,
  isBatchMode = false,
  isSelected = false,
  onToggleSelection,
}: QueuedTaskItemProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(task.name);
  const [isEditingDueDate, setIsEditingDueDate] = React.useState(false);
  const [isEditingNotes, setIsEditingNotes] = React.useState(false);
  const [notesValue, setNotesValue] = React.useState(task.notes || '');
  const [isEditingPriority, setIsEditingPriority] = React.useState(false);
  const [isEditingCategory, setIsEditingCategory] = React.useState(false);
  const [categoryValue, setCategoryValue] = React.useState(task.category || '');
  const [isEditingEstimate, setIsEditingEstimate] = React.useState(false);
  const [estimateValue, setEstimateValue] = React.useState(task.estimate || '');
  const [isEditingDependency, setIsEditingDependency] = React.useState(false);
  const [dependencyValue, setDependencyValue] = React.useState('');
  const [isEditingMilestone, setIsEditingMilestone] = React.useState(false);
  const [milestoneValue, setMilestoneValue] = React.useState(task.milestone || '');
  const [isAddingSubtask, setIsAddingSubtask] = React.useState(false);
  const [newSubtaskValue, setNewSubtaskValue] = React.useState('');
  const [editingSubtaskId, setEditingSubtaskId] = React.useState<string | null>(null);
  const [editingSubtaskValue, setEditingSubtaskValue] = React.useState('');
  const hasSubtasks = Boolean(task.subtasks && task.subtasks.length > 0);

  const priorityColors: Record<TaskPriority, string> = {
    high: 'bg-[var(--accent-error)]/20 text-[var(--accent-error)]',
    medium: 'bg-[var(--accent-warning)]/20 text-[var(--accent-warning)]',
    low: 'bg-[var(--text-secondary)]/20 text-[var(--text-secondary)]',
  };

  const handleStartEdit = () => {
    setEditValue(task.name);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== task.name && onEditTask) {
      onEditTask(task.name, trimmed);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditValue(task.name);
    setIsEditing(false);
  };

  const formatTime = (minutes?: number): string => {
    if (!minutes || minutes <= 0) return '0m';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    if (onSetDueDate) {
      onSetDueDate(task.name, date || null);
    }
    setIsEditingDueDate(false);
  };

  const handleClearDueDate = () => {
    if (onSetDueDate) {
      onSetDueDate(task.name, null);
    }
  };

  const handleStartEditNotes = () => {
    setNotesValue(task.notes || '');
    setIsEditingNotes(true);
  };

  const handleSaveNotes = () => {
    const trimmed = notesValue.trim();
    if (onSetTaskNote) {
      onSetTaskNote(task.name, trimmed || null);
    }
    setIsEditingNotes(false);
  };

  const handleCancelNotes = () => {
    setNotesValue(task.notes || '');
    setIsEditingNotes(false);
  };

  const handleNotesKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      handleSaveNotes();
    } else if (e.key === 'Escape') {
      handleCancelNotes();
    }
  };

  const formatDueDate = (dateStr?: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const isOverdue = (dateStr?: string): boolean => {
    if (!dateStr) return false;
    const due = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  };

  if (isEditing) {
    return (
      <div
        className={cn(
          'ui-interactive-card flex w-full items-center gap-3 rounded-[16px] border px-4 py-3',
          isGuidanceAligned
            ? 'ui-objective-highlight border-[rgba(94,142,242,0.22)] bg-[rgba(94,142,242,0.08)]'
            : 'border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)]'
        )}
      >
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 rounded-md border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.05)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
          autoFocus
          maxLength={500}
        />
        <div className="flex gap-2">
          <button onClick={handleSaveEdit} className="text-[var(--accent-primary)] hover:text-[var(--accent-primary-strong)]" aria-label="Save">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
          <button onClick={handleCancelEdit} className="text-[var(--text-secondary)] hover:text-[var(--accent-error)]" aria-label="Cancel">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'ui-interactive-card flex w-full items-center gap-3 rounded-[16px] border px-4 py-3 transition-all',
        isGuidanceAligned
          ? 'ui-objective-highlight border-[rgba(94,142,242,0.22)] bg-[rgba(94,142,242,0.08)]'
          : isBlocked
            ? 'border-[var(--border-subtle)]/50 bg-[rgba(255,255,255,0.02)] opacity-60'
            : isReadyToStart
              ? 'border-[var(--accent-primary)]/40 bg-[rgba(94,142,242,0.05)]'
              : isSecondary
                ? 'border-[var(--border-subtle)]/70 bg-[rgba(255,255,255,0.02)]'
                : 'border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)]',
        isReadyToStart && 'shadow-[0_2px_12px_rgba(94,142,242,0.1)]'
      )}
    >
      {isBatchMode && onToggleSelection && (
        <label className="flex items-center cursor-pointer flex-shrink-0">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelection}
            className="h-4 w-4 rounded border-[var(--border-subtle)] bg-[rgba(255,255,255,0.05)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
            aria-label={`Select ${task.name}`}
          />
        </label>
      )}
      <button
        onClick={() => onToggleTask(task.name)}
        type="button"
        aria-label={`Complete task: ${task.name}`}
        title="Complete task"
        className="flex flex-1 items-start gap-3 text-left"
      >
        <span
          className={cn(
            'mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-colors',
            isGuidanceAligned
              ? 'bg-[var(--accent-primary-soft)] text-[var(--accent-primary-strong)]'
              : isBlocked
                ? 'bg-[rgba(255,255,255,0.04)] text-[var(--text-secondary)]/50'
                : isReadyToStart
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'bg-[rgba(255,255,255,0.08)] text-[var(--text-secondary)]'
          )}
        >
          {index + 2}
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            {isGuidanceAligned && (
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-primary-strong)]">
                Guidance-aligned
              </p>
            )}
            {isReadyToStart && (
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-primary)]">
                <span className="inline-flex items-center gap-1">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Ready to start
                </span>
              </p>
            )}
            {isBlocked && (
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]/60">
                <span className="inline-flex items-center gap-1">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v.01M12 12a4 4 0 100-8 4 4 0 000 8zm0 0v4m0 0h.01" />
                  </svg>
                  Waiting on dependencies
                </span>
              </p>
            )}
          </div>
          <p className={cn(
            'text-sm leading-6',
            isBlocked ? 'text-[var(--text-secondary)]/70' : 'text-[var(--text-primary)]'
          )}>{task.name}</p>
          <div className="flex flex-wrap items-center gap-2">
            {task.dueDate && (
              <p
                className={cn(
                  'text-xs',
                  isOverdue(task.dueDate) ? 'text-[var(--accent-error)]' : 'text-[var(--text-secondary)]'
                )}
              >
                Due {formatDueDate(task.dueDate)}
                {isOverdue(task.dueDate) && ' (overdue)'}
              </p>
            )}
            {task.priority && (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]',
                  priorityColors[task.priority]
                )}
              >
                {task.priority}
              </span>
            )}
            {task.category && (
              <span className="rounded-full bg-[var(--accent-highlight)]/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--accent-highlight)]">
                {task.category}
              </span>
            )}
            {task.estimate && (
              <span className="rounded-full bg-[var(--accent-info)]/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--accent-info)]">
                ⏱️ {task.estimate}
              </span>
            )}
          </div>
        </div>
      </button>
      {onEditTask && !isEditing && (
        <button
          onClick={handleStartEdit}
          className="flex-shrink-0 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
          aria-label="Edit task"
          title="Edit task"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      )}
      {onSetDueDate && !isEditing && (
        <button
          onClick={() => setIsEditingDueDate(true)}
          className="flex-shrink-0 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
          aria-label="Set due date"
          title="Set due date"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
      )}
      {isEditingDueDate && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            defaultValue={task.dueDate || ''}
            onChange={handleDueDateChange}
            onBlur={() => setIsEditingDueDate(false)}
            className="rounded-md border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.05)] px-2 py-1 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
            autoFocus
          />
          {task.dueDate && (
            <button
              onClick={handleClearDueDate}
              className="text-[var(--text-secondary)] hover:text-[var(--accent-error)]"
              aria-label="Clear due date"
              title="Clear due date"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}
      {onSetTaskNote && !isEditing && (
        <button
          onClick={handleStartEditNotes}
          className="flex-shrink-0 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
          aria-label="Set note"
          title="Set note"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      )}
      {isEditingNotes && (
        <div className="flex flex-col gap-2 w-full max-w-xs">
          <textarea
            value={notesValue}
            onChange={(e) => setNotesValue(e.target.value)}
            onKeyDown={handleNotesKeyDown}
            className="rounded-md border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.05)] px-2 py-1 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none resize-none"
            autoFocus
            rows={2}
            maxLength={1000}
            placeholder="Add a note..."
          />
          <div className="flex gap-2">
            <button onClick={handleSaveNotes} className="text-[var(--accent-primary)] hover:text-[var(--accent-primary-strong)] text-xs">
              Save
            </button>
            <button onClick={handleCancelNotes} className="text-[var(--text-secondary)] hover:text-[var(--accent-error)] text-xs">
              Cancel
            </button>
          </div>
        </div>
      )}
      {onSetPriority && !isEditing && (
        <button
          onClick={() => setIsEditingPriority(true)}
          className="flex-shrink-0 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
          aria-label="Set priority"
          title="Set priority"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </button>
      )}
      {isEditingPriority && (
        <div className="flex items-center gap-2">
          <select
            value={task.priority || ''}
            onChange={(e) => {
              const value = e.target.value as TaskPriority | '';
              onSetPriority?.(task.name, value || null);
              setIsEditingPriority(false);
            }}
            onBlur={() => setIsEditingPriority(false)}
            className="rounded-md border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.05)] px-2 py-1 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
            autoFocus
          >
            <option value="">No priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <button
            onClick={() => setIsEditingPriority(false)}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      )}
      {onSetCategory && !isEditing && (
        <button
          onClick={() => setIsEditingCategory(true)}
          className="flex-shrink-0 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
          aria-label="Set category"
          title="Set category"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        </button>
      )}
      {isEditingCategory && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={categoryValue}
            onChange={(e) => setCategoryValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const trimmed = categoryValue.trim();
                if (trimmed && trimmed.length <= 50) {
                  onSetCategory?.(task.name, trimmed);
                } else if (!trimmed) {
                  onSetCategory?.(task.name, null);
                }
                setIsEditingCategory(false);
              }
              if (e.key === 'Escape') {
                setCategoryValue(task.category || '');
                setIsEditingCategory(false);
              }
            }}
            onBlur={() => {
              const trimmed = categoryValue.trim();
              if (trimmed && trimmed.length <= 50) {
                onSetCategory?.(task.name, trimmed);
              } else if (!trimmed) {
                onSetCategory?.(task.name, null);
              }
              setIsEditingCategory(false);
            }}
            className="rounded-md border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.05)] px-2 py-1 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
            autoFocus
            maxLength={50}
            placeholder="Category..."
          />
          <button
            onClick={() => setIsEditingCategory(false)}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      )}
      {onSetEstimate && !isEditing && (
        <button
          onClick={() => setIsEditingEstimate(true)}
          className="flex-shrink-0 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
          aria-label="Set estimate"
          title="Set estimate"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      )}
      {isEditingEstimate && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={estimateValue}
            onChange={(e) => setEstimateValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const trimmed = estimateValue.trim();
                if (trimmed && trimmed.length <= 20) {
                  onSetEstimate?.(task.name, trimmed);
                } else if (!trimmed) {
                  onSetEstimate?.(task.name, null);
                }
                setIsEditingEstimate(false);
              }
              if (e.key === 'Escape') {
                setEstimateValue(task.estimate || '');
                setIsEditingEstimate(false);
              }
            }}
            onBlur={() => {
              const trimmed = estimateValue.trim();
              if (trimmed && trimmed.length <= 20) {
                onSetEstimate?.(task.name, trimmed);
              } else if (!trimmed) {
                onSetEstimate?.(task.name, null);
              }
              setIsEditingEstimate(false);
            }}
            className="rounded-md border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.05)] px-2 py-1 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
            autoFocus
            maxLength={20}
            placeholder="e.g., 2h, 30m"
          />
          <button
            onClick={() => setIsEditingEstimate(false)}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      )}
      {onToggleTimeTracking && !isEditing && (
        <button
          onClick={() => onToggleTimeTracking(task.name)}
          className={`flex-shrink-0 transition-colors ${
            task.isTracking
              ? 'text-[var(--color-green)] animate-pulse'
              : 'text-[var(--text-secondary)] hover:text-[var(--accent-primary)]'
          }`}
          aria-label={task.isTracking ? 'Stop tracking' : 'Start tracking'}
          title={task.isTracking ? 'Stop tracking' : 'Start tracking'}
        >
          {task.isTracking ? (
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      )}
      {/* Dependency control */}
      {onSetDependency && allTasks && !isEditing && (
        <div className="relative">
          {isEditingDependency ? (
            <div className="flex items-center gap-1">
              <select
                value={dependencyValue}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value) {
                    onSetDependency(task.name, value);
                    setIsEditingDependency(false);
                    setDependencyValue('');
                  }
                }}
                onBlur={() => setIsEditingDependency(false)}
                className="rounded border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.05)] px-1 py-0.5 text-xs text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
                autoFocus
              >
                <option value="">Select...</option>
                {allTasks
                  .filter((t) => t.name !== task.name && !task.dependencies?.includes(t.name))
                  .map((t) => (
                    <option key={t.name} value={t.name}>
                      {t.name.slice(0, 20)}{t.name.length > 20 ? '...' : ''}
                    </option>
                  ))}
              </select>
              <button
                onClick={() => setIsEditingDependency(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                aria-label="Cancel"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : task.dependencies && task.dependencies.length > 0 ? (
            <div className="flex items-center gap-1">
              <span className="rounded-full bg-[var(--accent-highlight)]/20 px-2 py-0.5 text-[10px] font-semibold text-[var(--accent-highlight)]">
                <svg className="inline h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                </svg>
                {task.dependencies.length}
              </span>
              <button
                onClick={() => onSetDependency(task.name, null)}
                className="text-[var(--text-secondary)] hover:text-[var(--accent-error)]"
                aria-label="Remove dependencies"
                title="Remove dependencies"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingDependency(true)}
              className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
              aria-label="Add dependency"
              title="Add dependency"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </button>
          )}
        </div>
      )}
      {/* Milestone control */}
      {onSetMilestone && !isEditing && (
        <div className="relative">
          {isEditingMilestone ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={milestoneValue}
                onChange={(e) => setMilestoneValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const trimmed = milestoneValue.trim();
                    if (trimmed && trimmed !== task.milestone) {
                      onSetMilestone(task.name, trimmed);
                    } else if (!trimmed && task.milestone) {
                      onSetMilestone(task.name, null);
                    }
                    setIsEditingMilestone(false);
                    setMilestoneValue(trimmed);
                  } else if (e.key === 'Escape') {
                    setIsEditingMilestone(false);
                    setMilestoneValue(task.milestone || '');
                  }
                }}
                onBlur={() => {
                  const trimmed = milestoneValue.trim();
                  if (trimmed && trimmed !== task.milestone) {
                    onSetMilestone(task.name, trimmed);
                  } else if (!trimmed && task.milestone) {
                    onSetMilestone(task.name, null);
                  }
                  setIsEditingMilestone(false);
                  setMilestoneValue(trimmed);
                }}
                placeholder="Milestone..."
                className="rounded border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.05)] px-1 py-0.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[var(--accent-primary)] focus:outline-none w-20"
                autoFocus
                maxLength={30}
              />
              <button
                onClick={() => setIsEditingMilestone(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                aria-label="Cancel"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : task.milestone ? (
            <div className="flex items-center gap-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-primary)]/20 px-2 py-0.5 text-[10px] font-semibold text-[var(--accent-primary)]">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-8a2 2 0 012-2h14a2 2 0 012 2v8M9 10a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                {task.milestone.slice(0, 15)}{task.milestone.length > 15 ? '...' : ''}
              </span>
              <button
                onClick={() => onSetMilestone(task.name, null)}
                className="text-[var(--text-secondary)] hover:text-[var(--accent-error)]"
                aria-label="Clear milestone"
                title="Clear milestone"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingMilestone(true)}
              className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
              aria-label="Add milestone"
              title="Add milestone"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-8a2 2 0 012-2h14a2 2 0 012 2v8M9 10a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </button>
          )}
        </div>
      )}
      {/* Subtasks/checklist */}
      {onAddSubtask && !isEditing && (
        <div className="flex flex-col gap-1.5">
          {/* Subtask count badge */}
          {hasSubtasks && !isAddingSubtask && (
            <button
              onClick={() => setIsAddingSubtask(true)}
              type="button"
              className="flex items-center gap-1 text-[10px] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
              aria-label="Add subtask"
              title="Add subtask"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>
                {(task.subtasks?.filter((s) => s.completed).length ?? 0)}/{task.subtasks?.length ?? 0} subtasks
              </span>
            </button>
          )}
          {!hasSubtasks && !isAddingSubtask && (
            <button
              onClick={() => setIsAddingSubtask(true)}
              type="button"
              className="flex items-center gap-1 text-[10px] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
              aria-label="Add subtask"
              title="Add subtask"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add subtask
            </button>
          )}
          {/* Add subtask input */}
          {isAddingSubtask && (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={newSubtaskValue}
                onChange={(e) => setNewSubtaskValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const trimmed = newSubtaskValue.trim();
                    if (trimmed) {
                      onAddSubtask(task.name, trimmed);
                    }
                    setIsAddingSubtask(false);
                    setNewSubtaskValue('');
                  } else if (e.key === 'Escape') {
                    setIsAddingSubtask(false);
                    setNewSubtaskValue('');
                  }
                }}
                onBlur={() => {
                  const trimmed = newSubtaskValue.trim();
                  if (trimmed) {
                    onAddSubtask(task.name, trimmed);
                  }
                  setIsAddingSubtask(false);
                  setNewSubtaskValue('');
                }}
                placeholder="Add subtask..."
                className="rounded border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.05)] px-1 py-0.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[var(--accent-primary)] focus:outline-none w-24"
                autoFocus
                maxLength={100}
              />
              <button
                onClick={() => {
                  const trimmed = newSubtaskValue.trim();
                  if (trimmed) {
                    onAddSubtask(task.name, trimmed);
                  }
                  setIsAddingSubtask(false);
                  setNewSubtaskValue('');
                }}
                className="text-[var(--color-green)] hover:text-[var(--color-green)]"
                aria-label="Save subtask"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button
                onClick={() => {
                  setIsAddingSubtask(false);
                  setNewSubtaskValue('');
                }}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                aria-label="Cancel"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
      {(task.actualTime || 0) > 0 && !isEditing && (
        <span className="text-[10px] text-[var(--text-secondary)]">
          {formatTime(task.actualTime)}
        </span>
      )}
      {onReorderTask && !isEditing && !isFirst && (
        <button
          onClick={() => onReorderTask(task.name, 'up')}
          className="flex-shrink-0 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Move up"
          title="Move up in priority"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}
      {onReorderTask && !isEditing && !isLast && (
        <button
          onClick={() => onReorderTask(task.name, 'down')}
          className="flex-shrink-0 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Move down"
          title="Move down in priority"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
      {onDeleteTask && !isEditing && (
        <button
          onClick={() => onDeleteTask(task.name)}
          className="flex-shrink-0 text-[var(--text-secondary)] hover:text-[var(--accent-error)] transition-colors"
          aria-label="Delete task"
          title="Delete task"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

interface QueuedTaskListProps {
  tasks: Task[];
  priorityTask?: Task;
  guidanceTask?: string | null;
  onToggleTask: (taskName: string) => void;
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
  isBatchMode?: boolean;
  selectedTasks?: Set<string>;
  onToggleSelection?: (taskName: string) => void;
  isBlocked?: boolean;
}

export function QueuedTaskList({
  tasks,
  priorityTask,
  guidanceTask,
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
  isBatchMode = false,
  selectedTasks = new Set(),
  onToggleSelection,
}: QueuedTaskListProps) {
  const queuedTasks = tasks.filter((task) => task.name !== priorityTask?.name);

  // Helper to check if a task is blocked by dependencies
  const isTaskBlocked = (task: Task): boolean => {
    if (!task.dependencies || task.dependencies.length === 0) return false;
    return task.dependencies.some((depName) => {
      // Check if dependency is in the full task list (tasks) and not completed
      return tasks.some((t) => t.name === depName && !queuedTasks.find((qt) => qt.name === t.name));
    });
  };

  // Find first non-blocked task index for "ready to start" emphasis
  const firstReadyIndex = queuedTasks.findIndex((task) => !isTaskBlocked(task));

  return (
    <div className="ui-surface-secondary space-y-4 p-5">
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
          Next queued tasks
        </p>
        <p className="text-sm leading-6 text-[var(--text-secondary)]">
          These are the follow-on actions that keep the dossier moving once the current priority is done.
        </p>
      </div>

      {queuedTasks.length === 0 ? (
        <div className="rounded-[16px] border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.03)] px-4 py-4 text-sm text-[var(--text-secondary)]">
          No queued tasks yet. The next addition from guidance will appear here after the current priority.
        </div>
      ) : (
        <div className="space-y-2.5">
          {queuedTasks.map((task, index) => {
            const isGuidanceAligned = guidanceTask
              ? task.name.trim().toLowerCase() === guidanceTask.trim().toLowerCase()
              : false;
            const isBlocked = isTaskBlocked(task);
            const isReadyToStart = index === firstReadyIndex && !isBlocked;
            const isSecondary = index > 2;

            return (
              <QueuedTaskItem
                key={`${task.name}-${index}`}
                task={task}
                index={index}
                isGuidanceAligned={isGuidanceAligned}
                isBlocked={isBlocked}
                isReadyToStart={isReadyToStart}
                isSecondary={isSecondary}
                onToggleTask={onToggleTask}
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
                allTasks={tasks}
                isFirst={index === 0}
                isLast={index === queuedTasks.length - 1}
                isBatchMode={isBatchMode}
                isSelected={selectedTasks.has(task.name)}
                onToggleSelection={() => onToggleSelection?.(task.name)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
