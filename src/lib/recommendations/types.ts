import { type GuidancePrimaryDomain } from '@/src/lib/ai/domain/types';
import { type GuidanceModeId } from '@/src/lib/ai/modes/types';
import { type AITrainerId } from '@/src/lib/ai/types';
import { type CharacterProfile, type ProgressionState } from '@/src/lib/progression/types';

export type RecommendationSurface = 'universal_guidance' | 'trainer_compatibility';
export type InformationCompletenessLevel = 'low' | 'medium' | 'high';
export type RecommendationUrgencyLevel = 'low' | 'medium' | 'high';
export type MomentumState = 'none' | 'present';
export type AmbiguityState = 'clear' | 'sparse' | 'mixed' | 'contradictory';
export type FollowUpQuestionIntent =
  | 'clarify_goal'
  | 'clarify_urgency'
  | 'clarify_conflict'
  | 'clarify_execution_blocker'
  | 'clarify_documentation';

export interface FollowUpQuestionPlan {
  intent: FollowUpQuestionIntent;
  question: string;
}

export interface NormalizedSemanticSignals {
  informationCompleteness: InformationCompletenessLevel;
  urgencyLevel: RecommendationUrgencyLevel;
  conflictPresent: boolean;
  actionReady: boolean;
  executionReadiness: boolean;
  blockerPresence: boolean;
  momentumState: MomentumState;
  needsStructuring: boolean;
  riskSignalPresent: boolean;
  communicationPresent: boolean;
  hasTasks: boolean;
  ambiguityState: AmbiguityState;
}

export interface NormalizedDecisionInput {
  surface: RecommendationSurface;
  resultExists: boolean;
  detectedDomain?: GuidancePrimaryDomain;
  domainConfidence?: number;
  activeMode?: GuidanceModeId;
  phase?: string;
  shouldOfferDossier?: boolean;
  suggestedTaskCount?: number;
  totalTasks?: number;
  completedCount?: number;
  currentObjective?: string;
  currentGuidanceSummary?: string;
  currentGuidanceNextStep?: string;
  characterProfile?: CharacterProfile;
  progressionState?: ProgressionState;
  signals?: NormalizedSemanticSignals;
}

export interface TrainerRecommendationInput {
  phase: string;
  totalTasks: number;
  completedCount: number;
  currentObjective: string;
  currentGuidanceSummary?: string;
  currentGuidanceNextStep?: string;
  activeMode?: GuidanceModeId;
  detectedDomain?: GuidancePrimaryDomain;
  domainConfidence?: number;
  characterProfile?: CharacterProfile;
  progressionState?: ProgressionState;
}

export interface TrainerRecommendation {
  orderedTrainers: AITrainerId[];
  topTrainer: AITrainerId;
  confidenceLabel: 'high' | 'medium' | 'guarded';
  rationaleSummary: string;
  inlineActions: Array<{
    trainer: AITrainerId;
    label: string;
    emphasized: boolean;
  }>;
}
