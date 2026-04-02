"use client";

import React from 'react';
import { type ActivityEntry, type ActivityType } from '@/lib/mockData';
import { cn } from '@/lib/utils';

interface ActivityHistoryProps {
  activities: ActivityEntry[];
  maxDisplay?: number;
  completedCount?: number;
  totalTasks?: number;
}

const ACTIVITY_ICONS: Record<ActivityType, string> = {
  task_added: 'add',
  task_completed: 'done',
  task_uncompleted: 'undo',
  task_deleted: 'del',
  task_renamed: 'edit',
  task_due_date_set: 'date',
  task_due_date_cleared: 'date',
  task_note_set: 'note',
  task_note_cleared: 'note',
  task_priority_set: 'prio',
  task_priority_cleared: 'prio',
  task_category_set: 'cat',
  task_category_cleared: 'cat',
  task_estimate_set: 'eta',
  task_estimate_cleared: 'eta',
  task_tracking_started: 'track',
  task_tracking_stopped: 'track',
  task_dependency_added: 'link',
  task_dependency_removed: 'link',
  task_milestone_set: 'flag',
  task_milestone_cleared: 'flag',
  subtask_added: 'sub',
  subtask_completed: 'done',
  subtask_uncompleted: 'redo',
  subtask_edited: 'edit',
  subtask_deleted: 'del',
  phase_changed: 'phase',
  dossier_created: 'new',
  dossier_updated: 'update',
  completed: 'done',
  milestone_reached: 'mile',
};

const ACTIVITY_COLORS: Record<ActivityType, string> = {
  task_added: 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/10',
  task_completed: 'text-[var(--color-green)] bg-[var(--color-green)]/10',
  task_uncompleted: 'text-[var(--text-secondary)] bg-[rgba(255,255,255,0.05)]',
  task_deleted: 'text-[var(--accent-error)] bg-[var(--accent-error)]/10',
  task_renamed: 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/10',
  task_due_date_set: 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/10',
  task_due_date_cleared: 'text-[var(--text-secondary)] bg-[rgba(255,255,255,0.05)]',
  task_note_set: 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/10',
  task_note_cleared: 'text-[var(--text-secondary)] bg-[rgba(255,255,255,0.05)]',
  task_priority_set: 'text-[var(--accent-warning)] bg-[var(--accent-warning)]/10',
  task_priority_cleared: 'text-[var(--text-secondary)] bg-[rgba(255,255,255,0.05)]',
  task_category_set: 'text-[var(--accent-highlight)] bg-[var(--accent-highlight)]/10',
  task_category_cleared: 'text-[var(--text-secondary)] bg-[rgba(255,255,255,0.05)]',
  task_estimate_set: 'text-[var(--accent-info)] bg-[var(--accent-info)]/10',
  task_estimate_cleared: 'text-[var(--text-secondary)] bg-[rgba(255,255,255,0.05)]',
  task_tracking_started: 'text-[var(--color-green)] bg-[var(--color-green)]/10',
  task_tracking_stopped: 'text-[var(--text-secondary)] bg-[rgba(255,255,255,0.05)]',
  task_dependency_added: 'text-[var(--accent-highlight)] bg-[var(--accent-highlight)]/10',
  task_dependency_removed: 'text-[var(--text-secondary)] bg-[rgba(255,255,255,0.05)]',
  task_milestone_set: 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/10',
  task_milestone_cleared: 'text-[var(--text-secondary)] bg-[rgba(255,255,255,0.05)]',
  subtask_added: 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/10',
  subtask_completed: 'text-[var(--color-green)] bg-[var(--color-green)]/10',
  subtask_uncompleted: 'text-[var(--text-secondary)] bg-[rgba(255,255,255,0.05)]',
  subtask_edited: 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/10',
  subtask_deleted: 'text-[var(--accent-error)] bg-[var(--accent-error)]/10',
  phase_changed: 'text-[var(--accent-highlight)] bg-[var(--accent-highlight)]/10',
  dossier_created: 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/10',
  dossier_updated: 'text-[var(--accent-highlight)] bg-[var(--accent-highlight)]/10',
  completed: 'text-[var(--color-green)] bg-[var(--color-green)]/10',
  milestone_reached: 'text-[var(--accent-warning)] bg-[var(--accent-warning)]/10',
};

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function groupActivitiesByDate(activities: ActivityEntry[]): Map<string, ActivityEntry[]> {
  const groups = new Map<string, ActivityEntry[]>();

  activities.forEach((activity) => {
    const date = new Date(activity.timestamp);
    const dateKey = date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(activity);
  });

  return groups;
}

function getActivitySummary(activities: ActivityEntry[]): {
  total: number;
  completions: number;
  additions: number;
  hasProgress: boolean;
} {
  const completions = activities.filter(
    (a) =>
      a.type === 'task_completed' ||
      a.type === 'subtask_completed' ||
      a.type === 'completed' ||
      a.type === 'milestone_reached'
  ).length;

  const additions = activities.filter(
    (a) => a.type === 'task_added' || a.type === 'subtask_added' || a.type === 'dossier_created'
  ).length;

  return {
    total: activities.length,
    completions,
    additions,
    hasProgress: completions > 0 || additions > 0,
  };
}

export function ActivityHistory({ activities, maxDisplay = 10 }: ActivityHistoryProps) {
  const limitedActivities = activities.slice(0, maxDisplay);
  const grouped = groupActivitiesByDate(limitedActivities);
  const summary = getActivitySummary(limitedActivities);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Activity log</h3>
        <p className="text-xs text-[var(--text-secondary)]">
          Recent {summary.total} | {summary.completions} completions | {summary.additions} additions
        </p>
      </div>

      <div className="space-y-5">
        {[...grouped.entries()].map(([date, entries]) => (
          <div key={date} className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-secondary)]">{date}</p>
            <div className="space-y-2">
              {entries.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-3"
                >
                  <span
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold uppercase',
                      ACTIVITY_COLORS[activity.type]
                    )}
                  >
                    {ACTIVITY_ICONS[activity.type]}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{activity.description}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {activity.taskName ? `${activity.taskName} | ` : ''}
                      {formatTimestamp(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
