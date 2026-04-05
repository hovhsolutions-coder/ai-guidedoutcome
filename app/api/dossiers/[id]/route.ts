import { NextRequest, NextResponse } from 'next/server';
import { type MockDossier, type Task, type ActivityEntry, type ActivityType } from '@/lib/mockData';
import { getCurrentUserFromRequest } from '@/src/lib/auth/auth';
import { checkRateLimit } from '../../../../src/lib/rate-limit';
import { updateStoredDossier } from '@/src/lib/db/dossier-store';

// Maximum payload size for dossier updates (100KB)
const MAX_PAYLOAD_SIZE = 100 * 1024;

// Input validation limits
const MAX_STRING_LENGTH = 5000;
const MAX_TASKS = 100;
const MAX_TASK_LENGTH = 500;

function checkPayloadSize(request: NextRequest): { valid: boolean; error?: string } {
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_SIZE) {
    return { valid: false, error: 'Payload too large. Maximum size is 100KB.' };
  }
  return { valid: true };
}

function sanitizeString(input: unknown, defaultValue: string): string {
  if (typeof input !== 'string') return defaultValue;
  const trimmed = input.trim();
  if (trimmed.length === 0) return defaultValue;
  if (trimmed.length > MAX_STRING_LENGTH) return trimmed.slice(0, MAX_STRING_LENGTH);
  return trimmed;
}

function sanitizeTasks(input: unknown): Task[] {
  if (!Array.isArray(input)) return [];
  
  const tasks: Task[] = [];
  
  for (const t of input.slice(0, MAX_TASKS)) {
    if (typeof t === 'string' && t.trim().length > 0) {
      // Legacy string format - convert to Task
      tasks.push({
        name: t.length > MAX_TASK_LENGTH ? t.slice(0, MAX_TASK_LENGTH) : t,
      });
    } else if (typeof t === 'object' && t !== null && typeof (t as Task).name === 'string') {
      // Task object format
      const task = t as Task;
      const sanitized: Task = {
        name: task.name.length > MAX_TASK_LENGTH ? task.name.slice(0, MAX_TASK_LENGTH) : task.name,
      };
      // Validate and sanitize dueDate if present
      if (task.dueDate !== undefined) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (dateRegex.test(task.dueDate)) {
          const date = new Date(task.dueDate);
          if (!isNaN(date.getTime())) {
            sanitized.dueDate = task.dueDate;
          }
        }
      }
      // Validate and sanitize notes if present
      if (task.notes !== undefined) {
        const trimmedNotes = task.notes.trim();
        if (trimmedNotes.length > 0) {
          sanitized.notes = trimmedNotes.length > 1000 ? trimmedNotes.slice(0, 1000) : trimmedNotes;
        }
      }
      // Validate and sanitize priority if present
      if (task.priority !== undefined) {
        const validPriorities = ['high', 'medium', 'low'];
        if (validPriorities.includes(task.priority)) {
          sanitized.priority = task.priority as 'high' | 'medium' | 'low';
        }
      }
      // Validate and sanitize category if present
      if (task.category !== undefined) {
        const trimmedCategory = task.category.trim();
        if (trimmedCategory.length > 0) {
          sanitized.category = trimmedCategory.length > 50 ? trimmedCategory.slice(0, 50) : trimmedCategory;
        }
      }
      // Validate and sanitize estimate if present
      if (task.estimate !== undefined) {
        const trimmedEstimate = task.estimate.trim();
        if (trimmedEstimate.length > 0) {
          sanitized.estimate = trimmedEstimate.length > 20 ? trimmedEstimate.slice(0, 20) : trimmedEstimate;
        }
      }
      // Validate and sanitize actualTime if present (number, non-negative)
      if (task.actualTime !== undefined) {
        if (typeof task.actualTime === 'number' && task.actualTime >= 0) {
          sanitized.actualTime = task.actualTime;
        }
      }
      // Validate isTracking boolean
      if (task.isTracking !== undefined) {
        if (typeof task.isTracking === 'boolean') {
          sanitized.isTracking = task.isTracking;
        }
      }
      // Validate trackingStartedAt if present
      if (task.trackingStartedAt !== undefined) {
        // Check if it's a valid ISO date string
        if (typeof task.trackingStartedAt === 'string') {
          const date = new Date(task.trackingStartedAt);
          if (!isNaN(date.getTime())) {
            sanitized.trackingStartedAt = task.trackingStartedAt;
          }
        }
      }
      // Validate and sanitize dependencies if present
      if (task.dependencies !== undefined) {
        if (Array.isArray(task.dependencies)) {
          // Filter out non-string items, self-references, and duplicates
          const validDeps = task.dependencies
            .filter((d): d is string => typeof d === 'string' && d.trim().length > 0)
            .filter((d) => d !== task.name) // No self-dependency
            .slice(0, 10); // Max 10 dependencies per task
          
          // Remove duplicates
          sanitized.dependencies = [...new Set(validDeps)];
        }
      }
      // Validate and sanitize milestone if present
      if (task.milestone !== undefined) {
        const trimmedMilestone = task.milestone.trim();
        if (trimmedMilestone.length > 0) {
          sanitized.milestone = trimmedMilestone.length > 30 ? trimmedMilestone.slice(0, 30) : trimmedMilestone;
        }
      }
      // Validate and sanitize subtasks if present
      if (task.subtasks !== undefined) {
        if (Array.isArray(task.subtasks)) {
          const sanitizedSubtasks = task.subtasks
            .filter((s) => s && typeof s === 'object' && typeof s.id === 'string')
            .map((s) => {
              const name = typeof s.name === 'string' ? s.name.trim().slice(0, 100) : '';
              return {
                id: s.id,
                name: name,
                completed: s.completed === true,
              };
            })
            .filter((s) => s.name.length > 0)
            .slice(0, 20); // Max 20 subtasks per task
          
          if (sanitizedSubtasks.length > 0) {
            sanitized.subtasks = sanitizedSubtasks;
          }
        }
      }
      tasks.push(sanitized);
    }
  }
  
  return tasks;
}

function sanitizeCompletedTasks(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
    .map((t) => (t.length > MAX_TASK_LENGTH ? t.slice(0, MAX_TASK_LENGTH) : t))
    .slice(0, MAX_TASKS);
}

const VALID_ACTIVITY_TYPES = [
  'task_added', 'task_completed', 'task_uncompleted', 'task_deleted',
  'task_renamed', 'task_due_date_set', 'task_due_date_cleared',
  'task_note_set', 'task_note_cleared', 'task_priority_set', 'task_priority_cleared',
  'task_category_set', 'task_category_cleared', 'task_estimate_set', 'task_estimate_cleared',
  'task_tracking_started', 'task_tracking_stopped',
  'task_dependency_added', 'task_dependency_removed',
  'task_milestone_set', 'task_milestone_cleared',
  'subtask_added', 'subtask_completed', 'subtask_uncompleted', 'subtask_edited', 'subtask_deleted',
  'phase_changed'
] as const;

function sanitizeActivityHistory(input: unknown): ActivityEntry[] | undefined {
  if (!Array.isArray(input)) return undefined;
  
  const MAX_ACTIVITY_ENTRIES = 100;
  const sanitized: ActivityEntry[] = [];
  
  for (const entry of input.slice(0, MAX_ACTIVITY_ENTRIES)) {
    if (typeof entry !== 'object' || entry === null) continue;
    
    const e = entry as Partial<ActivityEntry>;
    
    // Validate required fields
    if (typeof e.id !== 'string' || !e.id) continue;
    if (typeof e.type !== 'string' || !VALID_ACTIVITY_TYPES.includes(e.type as typeof VALID_ACTIVITY_TYPES[number])) continue;
    if (typeof e.description !== 'string' || !e.description.trim()) continue;
    if (typeof e.timestamp !== 'string' || !e.timestamp) continue;
    
    // Sanitize optional fields
    const sanitizedEntry: ActivityEntry = {
      id: e.id.slice(0, 50), // Limit ID length
      type: e.type as ActivityType,
      description: e.description.slice(0, 200), // Limit description length
      timestamp: e.timestamp,
    };
    
    if (e.taskName && typeof e.taskName === 'string') {
      sanitizedEntry.taskName = e.taskName.slice(0, MAX_TASK_LENGTH);
    }
    if (e.oldValue && typeof e.oldValue === 'string') {
      sanitizedEntry.oldValue = e.oldValue.slice(0, 100);
    }
    if (e.newValue && typeof e.newValue === 'string') {
      sanitizedEntry.newValue = e.newValue.slice(0, 100);
    }
    
    sanitized.push(sanitizedEntry);
  }
  
  return sanitized.length > 0 ? sanitized : undefined;
}

function validatePhase(input: unknown): MockDossier['phase'] | undefined {
  const validPhases: MockDossier['phase'][] = ['Understanding', 'Structuring', 'Executing', 'Completed'];
  if (typeof input === 'string' && validPhases.includes(input as MockDossier['phase'])) {
    return input as MockDossier['phase'];
  }
  return undefined;
}

// Sanitize updates to prevent data corruption
function sanitizeUpdates(input: unknown): Partial<Omit<MockDossier, 'id' | 'createdAt'>> | null {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return null;
  }

  const u = input as Partial<Omit<MockDossier, 'id' | 'createdAt'>>;
  const sanitized: Partial<Omit<MockDossier, 'id' | 'createdAt'>> = {};

  // Only include fields that are actually present and valid
  if (u.title !== undefined) {
    const sanitizedTitle = sanitizeString(u.title, '');
    if (sanitizedTitle) sanitized.title = sanitizedTitle;
  }

  if (u.situation !== undefined) {
    const sanitizedSituation = sanitizeString(u.situation, '');
    if (sanitizedSituation) sanitized.situation = sanitizedSituation;
  }

  if (u.main_goal !== undefined) {
    const sanitizedGoal = sanitizeString(u.main_goal, '');
    if (sanitizedGoal) sanitized.main_goal = sanitizedGoal;
  }

  if (u.phase !== undefined) {
    const sanitizedPhase = validatePhase(u.phase);
    if (sanitizedPhase) sanitized.phase = sanitizedPhase;
  }

  if (u.progress !== undefined && typeof u.progress === 'number' && !isNaN(u.progress)) {
    sanitized.progress = Math.max(0, Math.min(100, Math.round(u.progress)));
  }

  if (u.lastActivity !== undefined) {
    sanitized.lastActivity = sanitizeString(u.lastActivity, '');
  }

  if (u.tasks !== undefined) {
    sanitized.tasks = sanitizeTasks(u.tasks);
  }

  if (u.completedTasks !== undefined) {
    sanitized.completedTasks = sanitizeCompletedTasks(u.completedTasks);
  }

  if (u.activityHistory !== undefined) {
    const sanitizedHistory = sanitizeActivityHistory(u.activityHistory);
    if (sanitizedHistory) sanitized.activityHistory = sanitizedHistory;
  }

  if (u.narrative !== undefined) {
    sanitized.narrative = u.narrative;
  }

  if (u.systemPlan !== undefined) {
    sanitized.systemPlan = u.systemPlan;
  }

  if (u.executionPlan !== undefined) {
    sanitized.executionPlan = u.executionPlan;
  }

  if (u.characterProfile !== undefined) {
    sanitized.characterProfile = u.characterProfile;
  }

  if (u.progressionState !== undefined) {
    sanitized.progressionState = u.progressionState;
  }

  return Object.keys(sanitized).length > 0 ? sanitized : null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Sign in to update this dossier.' },
        { status: 401 }
      );
    }

    // Payload size check
    const sizeCheck = checkPayloadSize(request);
    if (!sizeCheck.valid) {
      console.log(`[api:dossier:update:payload_too_large] id:${id}`);
      return NextResponse.json(
        { success: false, error: sizeCheck.error },
        { status: 413 }
      );
    }

    // Rate limiting check
    const rateLimitResult = checkRateLimit(request, { windowMs: 60 * 1000, maxRequests: 30 });
    if (!rateLimitResult.allowed) {
      console.log(`[api:dossier:update:rate_limit] blocked id:${id}, retry after ${rateLimitResult.retryAfter}s`);
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(rateLimitResult.resetTime / 1000)),
          },
        }
      );
    }

    const rawBody = await request.json();
    const updates = sanitizeUpdates(rawBody);

    // Validate that updates object is not empty after sanitization
    if (!updates) {
      console.log(`[api:dossier:update:reject] invalid_updates id:${id}`);
      return NextResponse.json(
        { success: false, error: 'No valid updates provided' },
        { status: 400 }
      );
    }

    const updatedDossier = await updateStoredDossier(id, updates, { ownerUserId: user.id });

    if (!updatedDossier) {
      console.log(`[api:dossier:update:not_found] id:${id}`);
      return NextResponse.json(
        { success: false, error: 'Dossier not found' },
        { status: 404 }
      );
    }

    console.log(`[api:dossier:update:success] id:${id}`);
    return NextResponse.json({
      success: true,
      data: updatedDossier,
    });
  } catch (error) {
    console.error(`[api:dossier:update:error]`, error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
