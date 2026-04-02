import { type GuidancePrimaryDomain } from '@/src/lib/ai/domain/types';
import { type GuidanceModeId } from '@/src/lib/ai/modes/types';

export type AIAction = 'guidance' | 'create_dossier';
export type AIExecutionMode = 'live' | 'local';
export type AITrainerId = 'strategy' | 'execution' | 'risk' | 'communication';

export interface AIRequestInput {
  action: AIAction;
  situation?: string;
  main_goal?: string;
  phase?: string;
  tasks?: string[];
  user_input?: string;
  triggerType?: 'auto' | 'quick_action' | 'manual';
  detectedDomain?: GuidancePrimaryDomain;
  activeMode?: GuidanceModeId;
  intakeAnswers?: Record<string, unknown>;
  guidanceSessionId?: string;
  shouldOfferDossier?: boolean;
  /** Execution context for context-aware guidance during task execution */
  executionContext?: Record<string, unknown>;
  /** Completed dossiers for cross-dossier reference context */
  completedDossiers?: Array<{ title: string; main_goal: string; id: string; relevanceScore?: number; outcomeSummary?: string; taskPatterns?: string[] }>;
}

export interface AIExecutionContext {
  mode: AIExecutionMode;
}

export interface AITrainerRequestInput {
  trainer: AITrainerId;
  situation?: string;
  main_goal?: string;
  phase?: string;
  tasks?: string[];
  current_objective?: string;
  guidance_next_step?: string;
}

export interface AIResponseOutput {
  summary: string;
  next_step: string;
  suggested_tasks: string[];
  /** Detected situation type for context-aware UI presentation */
  situationType?: 'unclear' | 'decision' | 'blocked' | 'planning' | 'execution' | 'empty';
}

export interface AITrainerResponseOutput {
  trainer: AITrainerId;
  focus_label: string;
  headline: string;
  key_insight: string;
  recommendation: string;
  next_move: string;
  support_points: string[];
  caution?: string;
  message_draft?: string;
  confidence_label: 'high' | 'medium' | 'guarded';
}

export interface AIRunnerResult {
  success: boolean;
  data?: AIResponseOutput;
  error?: string;
  rateLimited?: boolean;
}
