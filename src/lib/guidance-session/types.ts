import { type AITrainerId, type AITrainerResponseOutput } from '@/src/lib/ai/types';
import { type DomainDetectionInput, type GuidancePrimaryDomain } from '@/src/lib/ai/domain/types';
import { type GuidanceModeId } from '@/src/lib/ai/modes/types';
import { type CharacterProfile, type ProgressionState } from '@/src/lib/progression/types';
import { type FollowUpQuestionPlan, type TrainerRecommendation } from '@/src/lib/recommendations/types';

export type GuidanceOnboardingState =
  | 'intro_only'
  | 'intro_plus_followup'
  | 'intro_plus_next_step'
  | 'direct_next_step';

export type GuidanceSessionPhase =
  | 'clarifying'
  | 'refined_direction'
  | 'execution_ready';

export interface GuidanceProgressionSnapshot {
  phase: GuidanceSessionPhase;
  phaseLabel: string;
  phaseSummary: string;
  hasFollowUpHistory: boolean;
  showsFollowUp: boolean;
  showsNextStep: boolean;
}

export type GuidanceDecisionAuthorityLevel = 'authoritative' | 'degraded';

export type GuidanceDecisionAuthoritySource =
  | 'create_session'
  | 'server_first_pass'
  | 'server_continuation'
  | 'client_fallback_recomputed'
  | 'client_fallback_legacy_continuation';

export type GuidanceDecisionDegradedReason =
  | 'missing_authoritative_continuation'
  | 'legacy_continuation_contract';

export interface GuidanceDecisionAuthority {
  level: GuidanceDecisionAuthorityLevel;
  source: GuidanceDecisionAuthoritySource;
  degradedReason?: GuidanceDecisionDegradedReason;
}

export interface GuidanceIntentProfile {
  primaryIntent: 'understand' | 'decide' | 'plan' | 'execute' | 'stabilize';
  preferredTone: 'supportive' | 'direct' | 'structured';
  responseDepth: 'light' | 'guided' | 'structured';
}

export interface GuidanceExecutionReadiness {
  isReady: boolean;
  reason: 'needs_clarification' | 'needs_refinement' | 'route_ready';
}

export interface GuidanceSafeUiCapabilities {
  result: true;
  onboardingShell: boolean;
  trainerRecommendation: boolean;
  executionBridge: boolean;
  followUpInput: boolean;
  phaseProgression: boolean;
}

export interface GuidanceDecisionEnvelope {
  decisionVersion: 1;
  authority: GuidanceDecisionAuthority;
  domain: {
    primary: GuidancePrimaryDomain;
    confidence?: number;
    shouldOfferDossier: boolean;
  };
  mode: {
    active: GuidanceModeId;
    suggested: GuidanceModeId;
    userOverride?: GuidanceModeId;
  };
  intentProfile: GuidanceIntentProfile;
  narrative?: GuidanceNarrativeContract;
  systemPlan?: GuidanceSystemPlanContract;
  executionPlan?: GuidanceExecutionPlanContract;
  routeOutcome?: GuidanceRouteOutcome;
  trainerRecommendation?: TrainerRecommendation;
  followUpQuestion?: FollowUpQuestionPlan;
  onboardingState?: GuidanceOnboardingState;
  phase?: GuidanceSessionPhase;
  progressionSnapshot?: GuidanceProgressionSnapshot;
  executionReadiness: GuidanceExecutionReadiness;
  safeUiCapabilities: GuidanceSafeUiCapabilities;
}

export interface GuidanceNarrativeContract {
  situation: string;
  goal: string;
  constraints: string[];
  context: string;
  confidence: number;
  extractedFrom: {
    rawInput: string;
    intakeAnswers: Record<string, unknown>;
    timestamp: string;
  };
}

export interface DepartmentDefinition {
  id: string;
  name: string;
  role: string;
  responsibilities: string[];
  resources: string[];
  dependencies: string[];
}

export interface GuidanceSystemPlanContract {
  departments: DepartmentDefinition[];
  primaryDepartment: string;
  resourceAllocation: Record<string, string[]>;
  strategicPriorities: string[];
  generatedAt: string;
}

export interface TaskDefinition {
  id: string;
  title: string;
  description: string;
  department: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedDuration: string;
  dependencies: string[];
  deliverable: string;
}

export interface GuidanceExecutionPlanContract {
  tasks: TaskDefinition[];
  criticalPath: string[];
  milestones: Array<{
    name: string;
    tasks: string[];
    targetDate: string;
  }>;
  totalEstimatedDuration: string;
  generatedAt: string;
}

export interface GuidanceSessionResult {
  summary: string;
  nextStep: string;
  suggestedTasks: string[];
  narrative?: GuidanceNarrativeContract;
  systemPlan?: GuidanceSystemPlanContract;
  executionPlan?: GuidanceExecutionPlanContract;
}

export interface GuidanceContinuation {
  decision?: GuidanceDecisionEnvelope;
  detectedDomain: GuidancePrimaryDomain;
  activeMode: GuidanceModeId;
  shouldOfferDossier: boolean;
  routeOutcome: GuidanceRouteOutcome;
  trainerRecommendation: TrainerRecommendation;
  followUpQuestion?: FollowUpQuestionPlan;
  characterProfile?: CharacterProfile;
  progressionState?: ProgressionState;
}

export type GuidanceRouteOutcomeType =
  | 'stay_in_guidance'
  | 'convert_to_dossier'
  | 'continue_with_trainer'
  | 'continue_in_mode';

export interface GuidanceRouteOutcome {
  type: GuidanceRouteOutcomeType;
  reason: string;
  confidenceLabel: 'high' | 'medium' | 'guarded';
  rationaleSummary: string;
  activeMode?: GuidanceModeId;
  recommendedTrainer?: AITrainerId;
}

export interface GuidanceSession {
  id: string;
  initialInput: string;
  detectedDomain: GuidancePrimaryDomain;
  domainConfidence?: number;
  activeMode: GuidanceModeId;
  intakeAnswers: Record<string, unknown>;
  result?: GuidanceSessionResult;
  routeOutcome?: GuidanceRouteOutcome;
  trainerRecommendation?: TrainerRecommendation;
  followUpQuestion?: FollowUpQuestionPlan;
  onboardingState?: GuidanceOnboardingState;
  phase?: GuidanceSessionPhase;
  progressionSnapshot?: GuidanceProgressionSnapshot;
  characterProfile?: CharacterProfile;
  progressionState?: ProgressionState;
  trainerResponse?: AITrainerResponseOutput;
  linkedDossierId?: string | null;
  shouldOfferDossier: boolean;
  decision?: GuidanceDecisionEnvelope;
  createdAt: string;
}

export interface GuidanceSessionCreateInput {
  initialInput: string;
  domainDetectionInput?: DomainDetectionInput;
  intakeAnswers?: Record<string, unknown>;
  detectedDomain?: GuidancePrimaryDomain;
  domainConfidence?: number;
  activeMode?: GuidanceModeId;
  result?: GuidanceSessionResult;
  routeOutcome?: GuidanceRouteOutcome;
  trainerRecommendation?: TrainerRecommendation;
  followUpQuestion?: FollowUpQuestionPlan;
  onboardingState?: GuidanceOnboardingState;
  phase?: GuidanceSessionPhase;
  progressionSnapshot?: GuidanceProgressionSnapshot;
  characterProfile?: CharacterProfile;
  progressionState?: ProgressionState;
  trainerResponse?: AITrainerResponseOutput;
  linkedDossierId?: string | null;
  shouldOfferDossier?: boolean;
  decision?: GuidanceDecisionEnvelope;
  intentProfile?: GuidanceIntentProfile;
  createdAt?: string;
}