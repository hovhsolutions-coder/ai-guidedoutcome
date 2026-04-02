/**
 * Progress Analytics Types
 * 
 * A signaling layer for momentum, risk and progress behavior.
 * NOT decorative dashboards - compact insights that strengthen execution intelligence.
 */

import { type Task, type ActivityEntry } from '@/lib/mockData';

/**
 * Overall progress analytics for a dossier
 */
export interface ProgressAnalytics {
  /** Velocity trend - tasks completed per week */
  velocity: VelocityTrend;

  /** Health trend - is the dossier getting healthier or worse? */
  health: HealthTrend;

  /** Stall patterns - which tasks/categories stall frequently */
  stallPatterns: StallPattern[];

  /** Schedule adherence - does user follow recommended order? */
  scheduleAdherence: ScheduleAdherence;

  /** Forecast light - on track / slight delay / increased risk */
  forecast: ForecastLight;

  /** When this analytics snapshot was generated */
  generatedAt: string;
}

/**
 * Velocity trend - compact view of completion rate
 */
export interface VelocityTrend {
  /** Current weekly rate (tasks per week) */
  currentRate: number;
  /** Previous weekly rate for comparison */
  previousRate: number;
  /** Direction of trend */
  direction: 'accelerating' | 'steady' | 'slowing' | 'stalled';
  /** Human-readable summary */
  summary: string;
  /** Last 4 weeks data (compact) */
  recentWeeks: WeekVelocity[];
}

export interface WeekVelocity {
  week: string; // ISO week format: "2026-W13"
  tasksCompleted: number;
  subtasksCompleted: number;
  daysWithActivity: number;
}

/**
 * Health trend - dossier health over time
 */
export interface HealthTrend {
  /** Current health score (0-100) */
  current: number;
  /** Health score 7 days ago */
  weekAgo: number;
  /** Direction: improving, steady, declining */
  direction: 'improving' | 'steady' | 'declining';
  /** Key insight about health trajectory */
  insight: string;
  /** Risk flags based on trend */
  riskFlags: HealthRiskFlag[];
}

export type HealthRiskFlag =
  | 'health-declining-fast' // Dropped >20 points
  | 'health-declining' // Dropped 10-20 points
  | 'stall-accumulating' // More stalled tasks than before
  | 'blocker-increasing'; // More blocked tasks than before

/**
 * Stall pattern analysis
 */
export interface StallPattern {
  /** Category or task type that stalls */
  category: string;
  /** How many tasks in this category */
  totalTasks: number;
  /** How many have stalled */
  stalledCount: number;
  /** Stall rate (0-1) */
  stallRate: number;
  /** Average days stalled */
  avgDaysStalled: number;
  /** Pattern type */
  type: 'category' | 'priority' | 'size';
  /** Insight about this pattern */
  insight: string;
}

/**
 * Schedule adherence - does user follow recommended order?
 */
export interface ScheduleAdherence {
  /** Percentage of times user followed recommended next task (0-100) */
  adherenceRate: number;
  /** How many task completions were tracked */
  completionsTracked: number;
  /** Recent trend */
  recentTrend: 'improving' | 'steady' | 'declining';
  /** Why adherence matters here */
  insight: string;
  /** Notable deviations from recommendations */
  deviations?: string[];
}

/**
 * Forecast light - simple traffic light for trajectory
 */
export interface ForecastLight {
  /** Current status */
  status: 'on-track' | 'slight-delay' | 'increased-risk' | 'critical';
  /** Confidence in this forecast */
  confidence: 'high' | 'medium' | 'low';
  /** One-line explanation */
  explanation: string;
  /** Key factors driving this forecast */
  factors: ForecastFactor[];
  /** Suggested action based on forecast */
  suggestion: string;
}

export interface ForecastFactor {
  type: 'velocity' | 'health' | 'stalls' | 'blockers' | 'adherence';
  impact: 'positive' | 'neutral' | 'negative';
  description: string;
}

/**
 * Configuration for analytics calculations
 */
export interface AnalyticsConfig {
  /** Days to look back for trend analysis */
  trendWindowDays: number;
  /** Weeks to include in velocity calculation */
  velocityWeeks: number;
  /** Days threshold for stall detection */
  stallThresholdDays: number;
  /** Minimum completions for adherence calculation */
  minAdherenceCompletions: number;
}

export const DEFAULT_ANALYTICS_CONFIG: AnalyticsConfig = {
  trendWindowDays: 28, // 4 weeks
  velocityWeeks: 4,
  stallThresholdDays: 3,
  minAdherenceCompletions: 3,
};
