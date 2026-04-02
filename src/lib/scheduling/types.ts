/**
 * Smart Scheduling Types
 * 
 * A deterministic planning layer with AI-supported explanation.
 * Builds on execution intelligence to provide task ordering and schedule advice.
 */

import { type Task } from '@/lib/mockData';

/**
 * A scheduled task with reasoning context
 */
export interface ScheduledTask {
  task: Task;
  /** Recommended position in execution order (0 = do first) */
  order: number;
  /** Score combining all factors (higher = more important to do now) */
  score: number;
  /** Why this task is positioned here */
  reasoning: ScheduleReasoning;
  /** Risk assessment for this task */
  risk: ScheduleRisk;
  /** Confidence in the recommendation */
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Reasoning for why a task is scheduled where it is
 */
export interface ScheduleReasoning {
  /** Primary factor determining this position */
  primaryFactor: ScheduleFactor;
  /** Secondary factors that contributed */
  secondaryFactors: ScheduleFactor[];
  /** Human-readable explanation */
  explanation: string;
  /** What this task unlocks (if anything) */
  unlocks?: string[];
  /** What's blocking this task (if anything) */
  blockedBy?: string[];
}

/**
 * Factors that influence scheduling position
 */
export type ScheduleFactor =
  | 'key-unlocker'      // Unblocks multiple other tasks
  | 'blocked'           // Currently blocked - lower priority
  | 'near-due'          // Due date approaching
  | 'overdue'           // Past due date
  | 'high-priority'     // Marked high priority
  | 'health-weighted'   // Dossier health makes this more urgent
  | 'stalled'           // No activity for 3+ days (risk flag, not priority)
  | 'small-effort'      // Quick win for momentum
  | 'large-effort'      // Needs dedicated focus block
  | 'dependency-chain'  // Part of a dependency chain
  | 'momentum'          // Good for maintaining flow;

/**
 * Risk assessment for a scheduled task
 */
export interface ScheduleRisk {
  /** Overall risk level */
  level: 'none' | 'low' | 'medium' | 'high';
  /** Specific risk types applicable */
  types: ScheduleRiskType[];
  /** Human-readable risk explanation */
  explanation: string;
}

export type ScheduleRiskType =
  | 'likely-late'       // Probably won't finish on time
  | 'no-realistic-slot' // Can't fit in schedule
  | 'dependency-breaks' // Dependencies make planning unreliable
  | 'too-much-open-work' // Too many parallel tasks
  | 'stalled'           // No recent activity
  | 'overdue'           // Past due date
  | 'blocked'           // Currently blocked
  | 'large-effort';     // Needs dedicated focus block

/**
 * Overall schedule recommendation for a dossier
 */
export interface ScheduleRecommendation {
  /** Top 3 recommended tasks in order */
  nextTasks: ScheduledTask[];
  /** Tasks that can wait but are scheduled */
  queuedTasks: ScheduledTask[];
  /** Tasks that are blocked - not recommended now */
  blockedTasks: ScheduledTask[];
  /** Overall schedule risks */
  globalRisks: GlobalScheduleRisk[];
  /** Today's suggested focus */
  todayFocus: TodayFocus;
  /** This week's suggested focus */
  weekFocus: WeekFocus;
  /** When this recommendation was generated */
  generatedAt: string;
  /** Version of the scheduling engine */
  version: string;
}

/**
 * Global risks that affect the entire schedule
 */
export interface GlobalScheduleRisk {
  type: ScheduleRiskType;
  severity: 'warning' | 'critical';
  message: string;
  affectedTasks: string[];
  suggestion: string;
}

/**
 * Suggested focus for today
 */
export interface TodayFocus {
  /** Primary task to focus on */
  primaryTask: string | null;
  /** Secondary tasks if primary is blocked/done */
  fallbackTasks: string[];
  /** Recommended approach */
  approach: string;
  /** Why this focus */
  reasoning: string;
}

/**
 * Suggested focus for this week
 */
export interface WeekFocus {
  /** Main objectives for the week */
  objectives: string[];
  /** Tasks to complete */
  targetTasks: string[];
  /** Risks to watch */
  watchFor: string[];
  /** Overall confidence in the week plan */
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Configuration for the scheduling engine
 */
export interface ScheduleConfig {
  /** Days threshold for considering a task stalled */
  stalledThresholdDays: number;
  /** Days before due date to flag as "near due" */
  nearDueThresholdDays: number;
  /** Maximum parallel tasks to recommend */
  maxParallelTasks: number;
  /** Weight given to unlocker bonus (0-1) */
  unlockerWeight: number;
  /** Weight given to due date proximity (0-1) */
  dueDateWeight: number;
  /** Weight given to priority (0-1) */
  priorityWeight: number;
  /** Weight given to dossier health (0-1) */
  healthWeight: number;
  /** Weight given to effort size (0-1) */
  effortWeight: number;
}

/** Default schedule configuration */
export const DEFAULT_SCHEDULE_CONFIG: ScheduleConfig = {
  stalledThresholdDays: 3,
  nearDueThresholdDays: 2,
  maxParallelTasks: 3,
  unlockerWeight: 0.35,
  dueDateWeight: 0.25,
  priorityWeight: 0.20,
  healthWeight: 0.15,
  effortWeight: 0.05,
};
