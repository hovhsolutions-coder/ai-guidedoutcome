import React from 'react';
import { cn } from '@/lib/utils';
import { type Task, type TaskPriority } from '@/lib/mockData';

interface PriorityTaskCardProps {
  task: Task;
  focusBadge: string;
  statusLine: string;
  isAlignedWithGuidance: boolean;
  onToggleTask: (taskName: string) => void;
  onDeleteTask?: (taskName: string) => void;
  onEditTask?: (oldTaskName: string, newTaskName: string) => void;
  onReorderTask?: (taskName: string, direction: 'up' | 'down') => void;
  // Kept for compatibility but not displayed in simplified UI
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
  completedTasks?: Set<string>;
  isFirst?: boolean;
  isLast?: boolean;
  isBatchMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: () => void;
  hasStarted?: boolean;
  isLastTask?: boolean;
}

export function PriorityTaskCard({
  task,
  focusBadge,
  statusLine,
  isAlignedWithGuidance,
  onToggleTask,
  onDeleteTask,
  onEditTask,
  onReorderTask,
  onAddSubtask,
  onToggleSubtask,
  onEditSubtask,
  onDeleteSubtask,
  allTasks,
  completedTasks,
  isFirst = false,
  isLast = false,
  isBatchMode = false,
  isSelected = false,
  onToggleSelection,
  hasStarted = false,
  isLastTask = false,
}: PriorityTaskCardProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(task.name);
  const [isAddingSubtask, setIsAddingSubtask] = React.useState(false);
  const [newSubtaskValue, setNewSubtaskValue] = React.useState('');
  const [editingSubtaskId, setEditingSubtaskId] = React.useState<string | null>(null);
  const [editingSubtaskValue, setEditingSubtaskValue] = React.useState('');
  const [showActions, setShowActions] = React.useState(false);
  const hasSubtasks = Boolean(task.subtasks && task.subtasks.length > 0);

  // Check if task is blocked by uncompleted dependencies
  const isBlocked = task.dependencies && task.dependencies.length > 0 && allTasks && completedTasks
    ? task.dependencies.some((depName) => {
        const depTask = allTasks.find((t) => t.name === depName);
        return depTask && !completedTasks.has(depName);
      })
    : false;

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
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

  return (
    <div className={cn(
      'ui-surface-primary rounded-[14px] border p-4 transition-all',
      isFirst && !isBlocked
        ? 'border-[var(--accent-primary)] bg-[rgba(94,142,242,0.08)] shadow-[0_4px_24px_rgba(94,142,242,0.2)]' 
        : 'border-[var(--border-subtle)]',
      isBlocked && isFirst && 'border-[var(--accent-warning)] bg-[rgba(234,179,8,0.04)]',
      isBlocked && !isFirst && 'border-[var(--accent-error)]/30 bg-[rgba(239,68,68,0.04)]'
    )}>
      {/* Start here header for first task - bridges preview priming */}
      {isFirst && !isBlocked && !hasStarted && (
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[var(--accent-primary)]/20">
          <div className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent-primary)] text-white">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent-primary)]">
            Start here
          </span>
          <span className="text-xs text-[var(--text-secondary)]">
            — complete this first
          </span>
        </div>
      )}

      {/* Continue with header - maintains momentum after first completion */}
      {isFirst && !isBlocked && hasStarted && !isLastTask && (
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[var(--color-green)]/20">
          <div className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-green)] text-white">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-green)]">
            Continue with
          </span>
          <span className="text-xs text-[var(--text-secondary)]">
            — next in sequence
          </span>
        </div>
      )}

      {/* Finish with header - signals closing phase when only one task remains */}
      {isLastTask && !isBlocked && (
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[var(--accent-warning)]/30">
          <div className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent-warning)] text-white">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent-warning)]">
            Finish with
          </span>
          <span className="text-xs text-[var(--text-secondary)]">
            — complete to close out
          </span>
        </div>
      )}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          {isBatchMode && onToggleSelection && (
            <label className="flex items-center cursor-pointer mt-1">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={onToggleSelection}
                className="h-4 w-4 rounded border-[var(--border-subtle)] bg-[rgba(255,255,255,0.05)] text-[var(--accent-primary)]"
                aria-label={`Select ${task.name}`}
              />
            </label>
          )}
          
          {/* Main checkbox to complete task - enlarged for touch */}
          <button
            onClick={() => onToggleTask(task.name)}
            type="button"
            className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full border-2 border-[var(--accent-primary)] hover:bg-[var(--accent-primary-soft)] transition-colors flex items-center justify-center"
            aria-label="Complete task"
            title="Complete task"
          >
            <svg className="h-5 w-5 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
          {isFirst && !isBlocked && (
            <span className="flex items-center gap-1.5 rounded-full bg-[var(--accent-primary)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white shadow-[0_2px_8px_rgba(94,142,242,0.4)]">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Do This First
            </span>
          )}
          {isFirst && isBlocked && (
            <span className="flex items-center gap-1.5 rounded-full bg-[var(--accent-warning)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v.01M12 12a4 4 0 100-8 4 4 0 000 8zm0 0v4m0 0h.01M12 19h.01M12 19h.01" />
              </svg>
              Blocked — See Below
            </span>
          )}
          {isBlocked && !isFirst && (
            <span className="flex items-center gap-1 rounded-full bg-[var(--accent-error)]/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--accent-error)]">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Blocked
            </span>
          )}
              {task.priority && (
                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]', priorityColors[task.priority])}>
                  {task.priority}
                </span>
              )}
              {task.dueDate && (
                <span className={cn('text-xs', isOverdue(task.dueDate) ? 'text-[var(--accent-error)] font-medium' : 'text-[var(--text-secondary)]')}>
                  Due {formatDueDate(task.dueDate)}
                  {isOverdue(task.dueDate) && ' (overdue)'}
                </span>
              )}
            </div>

            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 rounded-md border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.05)] px-3 py-1.5 text-base font-semibold text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
                  autoFocus
                  maxLength={500}
                />
                <button onClick={handleSaveEdit} className="text-[var(--color-green)]" aria-label="Save">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <button onClick={handleCancelEdit} className="text-[var(--text-secondary)]" aria-label="Cancel">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <p
                className={cn(
                  "cursor-pointer transition-colors",
                  isFirst ? "text-lg font-semibold text-[var(--text-primary)]" : "text-base font-semibold text-[var(--text-primary)]",
                  isBlocked && "text-[var(--text-secondary)]",
                  !isBlocked && "hover:text-[var(--accent-primary)]"
                )}
                onClick={onEditTask ? handleStartEdit : undefined}
                title={onEditTask ? 'Click to edit' : undefined}
              >
                {task.name}
              </p>
            )}

            {/* Subtask list - simplified */}
            {hasSubtasks && (
              <div className="mt-2 space-y-1">
                {task.subtasks?.map((subtask) => (
                  <div key={subtask.id} className="flex items-center gap-2">
                    {editingSubtaskId === subtask.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editingSubtaskValue}
                          onChange={(e) => setEditingSubtaskValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const trimmed = editingSubtaskValue.trim();
                              if (trimmed && trimmed !== subtask.name) {
                                onEditSubtask?.(task.name, subtask.id, trimmed);
                              }
                              setEditingSubtaskId(null);
                            } else if (e.key === 'Escape') {
                              setEditingSubtaskId(null);
                            }
                          }}
                          onBlur={() => {
                            const trimmed = editingSubtaskValue.trim();
                            if (trimmed && trimmed !== subtask.name) {
                              onEditSubtask?.(task.name, subtask.id, trimmed);
                            }
                            setEditingSubtaskId(null);
                          }}
                          className="flex-1 rounded border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.05)] px-2 py-0.5 text-sm text-[var(--text-primary)]"
                          autoFocus
                          maxLength={100}
                        />
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => onToggleSubtask?.(task.name, subtask.id)}
                          className={`flex-shrink-0 p-1 ${subtask.completed ? 'text-[var(--color-green)]' : 'text-[var(--text-secondary)]'}`}
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {subtask.completed ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                            )}
                          </svg>
                        </button>
                        <span className={`text-sm flex-1 ${subtask.completed ? 'line-through text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}>
                          {subtask.name}
                        </span>
                        <button
                          onClick={() => {
                            setEditingSubtaskId(subtask.id);
                            setEditingSubtaskValue(subtask.name);
                          }}
                          className="p-2 text-[var(--text-secondary)] hover:text-[var(--accent-primary)]"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onDeleteSubtask?.(task.name, subtask.id)}
                          className="p-2 text-[var(--text-secondary)] hover:text-[var(--accent-error)]"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                ))}
                {/* Add subtask input */}
                {isAddingSubtask ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newSubtaskValue}
                      onChange={(e) => setNewSubtaskValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const trimmed = newSubtaskValue.trim();
                          if (trimmed) onAddSubtask?.(task.name, trimmed);
                          setIsAddingSubtask(false);
                          setNewSubtaskValue('');
                        } else if (e.key === 'Escape') {
                          setIsAddingSubtask(false);
                          setNewSubtaskValue('');
                        }
                      }}
                      onBlur={() => {
                        const trimmed = newSubtaskValue.trim();
                        if (trimmed) onAddSubtask?.(task.name, trimmed);
                        setIsAddingSubtask(false);
                        setNewSubtaskValue('');
                      }}
                      placeholder="Add subtask..."
                      className="flex-1 rounded border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.05)] px-2 py-0.5 text-sm text-[var(--text-primary)]"
                      autoFocus
                      maxLength={100}
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAddingSubtask(true)}
                    type="button"
                    className="flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--accent-primary)]"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add subtask
                  </button>
                )}
              </div>
            )}

            {!hasSubtasks && (
              <div className="mt-2 space-y-1">
                {isAddingSubtask ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newSubtaskValue}
                      onChange={(e) => setNewSubtaskValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const trimmed = newSubtaskValue.trim();
                          if (trimmed) onAddSubtask?.(task.name, trimmed);
                          setIsAddingSubtask(false);
                          setNewSubtaskValue('');
                        } else if (e.key === 'Escape') {
                          setIsAddingSubtask(false);
                          setNewSubtaskValue('');
                        }
                      }}
                      onBlur={() => {
                        const trimmed = newSubtaskValue.trim();
                        if (trimmed) onAddSubtask?.(task.name, trimmed);
                        setIsAddingSubtask(false);
                        setNewSubtaskValue('');
                      }}
                      placeholder="Add subtask..."
                      className="flex-1 rounded border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.05)] px-2 py-0.5 text-sm text-[var(--text-primary)]"
                      autoFocus
                      maxLength={100}
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAddingSubtask(true)}
                    type="button"
                    className="flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--accent-primary)]"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add subtask
                  </button>
                )}
              </div>
            )}

            {/* Add subtask button when no subtasks */}
            {(!task.subtasks || task.subtasks.length === 0) && onAddSubtask && (
              <button
                onClick={() => setIsAddingSubtask(true)}
                className="mt-2 flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--accent-primary)]"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add subtask
              </button>
            )}

            <p className="text-sm text-[var(--text-secondary)] mt-2">{statusLine}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-subtle)]">
          <button onClick={() => onToggleTask(task.name)} className="ui-button-primary text-sm px-3 py-1.5">
            {isBlocked ? 'Waiting...' : 'Complete'}
          </button>
          
          <button
            onClick={() => setShowActions(!showActions)}
            className="ui-button-secondary text-sm px-3 py-1.5"
          >
            {showActions ? 'Less' : 'More'}
          </button>

          {showActions && (
            <>
              {onEditTask && !isEditing && (
                <button onClick={handleStartEdit} className="ui-button-secondary text-sm px-3 py-1.5">
                  Edit
                </button>
              )}
              {onDeleteTask && (
                <button onClick={() => onDeleteTask(task.name)} className="ui-button-secondary text-sm px-3 py-1.5 text-[var(--accent-error)]">
                  Delete
                </button>
              )}
              {onReorderTask && !isLast && (
                <button onClick={() => onReorderTask(task.name, 'down')} className="ui-button-secondary text-sm px-3 py-1.5">
                  ↓
                </button>
              )}
            </>
          )}
          
          <span className="ml-auto text-xs text-[var(--text-secondary)] italic">
            {isBlocked ? 'Complete dependencies first' : isFirst ? 'Start here' : 'Next up'}
          </span>
        </div>
      </div>
    </div>
  );
}
