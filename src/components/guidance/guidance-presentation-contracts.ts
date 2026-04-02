import { type GuidancePrimaryDomain } from '@/src/lib/ai/domain/types';
import { type GuidanceModeId } from '@/src/lib/ai/modes/types';
import { type AIResponseOutput, type AITrainerId, type AITrainerResponseOutput } from '@/src/lib/ai/types';
import {
  type GuidanceSession,
  type GuidanceNarrativeContract,
  type GuidanceSystemPlanContract,
  type GuidanceExecutionPlanContract,
} from '@/src/lib/guidance-session/types';

export interface GuidanceSubmitPresentation {
  label: string;
  helperText: string;
  disabled: boolean;
}

export type GuidanceProgressMessageState =
  | 'fresh_ready'
  | 'fresh_submit_loading'
  | 'fresh_retry_ready'
  | 'clarifying_ready'
  | 'clarifying_continue_loading'
  | 'refined_ready'
  | 'trainer_request_loading'
  | 'trainer_retry_ready'
  | 'dossier_conversion_loading'
  | 'execution_ready'
  | 'degraded_result_fallback';

export interface GuidanceProgressMessagePresentation {
  state: GuidanceProgressMessageState;
  eyebrow: string;
  title: string;
  statusLine: string;
  tone: 'neutral' | 'progress' | 'steady';
}

export type GuidanceSurfaceVariant =
  | 'capture_surface'
  | 'clarify_surface'
  | 'understand_surface'
  | 'explore_surface'
  | 'commit_surface'
  | 'degraded_understand_surface';

export type GuidanceRightRailRole =
  | 'support'
  | 'context'
  | 'deepen'
  | 'handoff';

export type GuidanceRightRailEmphasis =
  | 'subtle'
  | 'balanced'
  | 'strong';

export interface GuidanceRightRailProfilePresentation {
  visibility: GuidanceSectionRenderStatus;
  role: GuidanceRightRailRole;
  emphasis: GuidanceRightRailEmphasis;
  density: GuidanceContentDensity;
  continuity: GuidanceTransitionContinuity;
}

export type GuidanceActiveFocusTarget =
  | 'intake'
  | 'follow_up'
  | 'result'
  | 'trainer'
  | 'execution_transition'
  | 'degraded_result';

export type GuidanceFocusZone =
  | 'intake'
  | 'onboarding'
  | 'result'
  | 'trainer'
  | 'execution';

export type GuidanceZoneFocusState =
  | 'dominant'
  | 'secondary'
  | 'hidden';

export type GuidanceSectionRenderStatus =
  | 'visible'
  | 'soft_hidden'
  | 'suppressed';

export type GuidanceContentDensity =
  | 'minimal'
  | 'guided'
  | 'expanded';

export type GuidancePrimaryCtaContext =
  | 'submit'
  | 'follow_up'
  | 'trainer'
  | 'dossier_convert'
  | 'none';

export interface GuidanceActiveFocusPresentation {
  target: GuidanceActiveFocusTarget;
  dominantZone: GuidanceFocusZone;
  primaryCta: GuidancePrimaryCtaContext;
}

export interface GuidanceStructuredContractsPresentation {
  narrative: GuidanceNarrativeContract | null;
  systemPlan: GuidanceSystemPlanContract | null;
  executionPlan: GuidanceExecutionPlanContract | null;
  hasStructuredData: boolean;
}

export interface GuidanceSectionVisibilityPresentation {
  intake: GuidanceSectionRenderStatus;
  onboarding: GuidanceSectionRenderStatus;
  result: GuidanceSectionRenderStatus;
  trainer: GuidanceSectionRenderStatus;
  execution: GuidanceSectionRenderStatus;
}

export interface GuidanceContentDensityPresentation {
  intake: GuidanceContentDensity | null;
  onboarding: GuidanceContentDensity | null;
  result: GuidanceContentDensity | null;
  trainer: GuidanceContentDensity | null;
  execution: GuidanceContentDensity | null;
}

export type GuidanceMicrocopyIntent =
  | 'orient'
  | 'confirm'
  | 'deepen'
  | 'activate';

export interface GuidanceMicrocopyIntentPresentation {
  intake: GuidanceMicrocopyIntent | null;
  onboarding: GuidanceMicrocopyIntent | null;
  result: GuidanceMicrocopyIntent | null;
  trainer: GuidanceMicrocopyIntent | null;
  execution: GuidanceMicrocopyIntent | null;
}

export type GuidanceSectionOutcome =
  | 'capture'
  | 'clarify'
  | 'understand'
  | 'explore'
  | 'commit';

export interface GuidanceSectionOutcomePresentation {
  intake: GuidanceSectionOutcome | null;
  onboarding: GuidanceSectionOutcome | null;
  result: GuidanceSectionOutcome | null;
  trainer: GuidanceSectionOutcome | null;
  execution: GuidanceSectionOutcome | null;
}

export type GuidanceSurfaceRhythm =
  | 'compact'
  | 'steady'
  | 'spacious';

export interface GuidanceSurfaceRhythmPresentation {
  intake: GuidanceSurfaceRhythm | null;
  onboarding: GuidanceSurfaceRhythm | null;
  result: GuidanceSurfaceRhythm | null;
  trainer: GuidanceSurfaceRhythm | null;
  execution: GuidanceSurfaceRhythm | null;
}

export type GuidanceTransitionContinuity =
  | 'persist'
  | 'settle'
  | 'advance';

export interface GuidanceTransitionContinuityPresentation {
  intake: GuidanceTransitionContinuity | null;
  onboarding: GuidanceTransitionContinuity | null;
  result: GuidanceTransitionContinuity | null;
  trainer: GuidanceTransitionContinuity | null;
  execution: GuidanceTransitionContinuity | null;
}

export type GuidanceVisualWeight =
  | 'subtle'
  | 'balanced'
  | 'strong';

export interface GuidanceVisualWeightPresentation {
  intake: GuidanceVisualWeight | null;
  onboarding: GuidanceVisualWeight | null;
  result: GuidanceVisualWeight | null;
  trainer: GuidanceVisualWeight | null;
  execution: GuidanceVisualWeight | null;
}

export interface GuidanceZoneProfile {
  zone: GuidanceFocusZone;
  visibility: GuidanceSectionRenderStatus;
  focusState: GuidanceZoneFocusState;
  isDominant: boolean;
  primaryCta: GuidancePrimaryCtaContext | null;
  contentDensity: GuidanceContentDensity | null;
  microcopyIntent: GuidanceMicrocopyIntent | null;
  sectionOutcome: GuidanceSectionOutcome | null;
  surfaceRhythm: GuidanceSurfaceRhythm | null;
  transitionContinuity: GuidanceTransitionContinuity | null;
  visualWeight: GuidanceVisualWeight | null;
}

export interface GuidanceZoneProfilesPresentation {
  intake: GuidanceZoneProfile;
  onboarding: GuidanceZoneProfile;
  result: GuidanceZoneProfile;
  trainer: GuidanceZoneProfile;
  execution: GuidanceZoneProfile;
}

export interface GuidanceUniversalIntakePresentation {
  eyebrow: string;
  title: string;
  description: string;
  optionalLabel: string;
  optionalDescription: string;
  // Domain insight: what the system thinks this is about (complements mode suggestion)
  domainInsight: {
    detectedDomain: GuidancePrimaryDomain | null;
    confidence: number | null;
    hasInput: boolean;
    insightLabel: string;
    insightDescription: string | null;
  };
}

export interface GuidanceModeIntakePresentation {
  hasPrimaryInput: boolean;
  detectedDomain: GuidancePrimaryDomain | null;
  recommendedMode: GuidanceModeId | null;
  shouldOfferDossier: boolean;
  eyebrow: string;
  description: string;
  domainLabel: string;
  domainValue: string;
  dossierLabel: string;
  dossierValue: string;
  waitingTitle: string;
  waitingDescription: string;
  autoModeTitle: string;
  autoModeDescription: string;
  overrideTitle: string;
  structuredDescription: string;
  // Mode suggestion UI extension
  modeSuggestion: {
    suggestedMode: GuidanceModeId | null;
    activeMode: GuidanceModeId | null;
    hasUserOverride: boolean;
    rationale: string | null;
    systemLabel: string;
    overrideLabel: string;
  };
}

export interface GuidanceIntakePresentation {
  universal: GuidanceUniversalIntakePresentation;
  mode: GuidanceModeIntakePresentation;
  submit: GuidanceSubmitPresentation;
}

export interface GuidanceCurrentReadPresentation {
  label: string;
  summary: string;
}

export interface GuidanceResultPanelPresentation {
  result: AIResponseOutput | null;
  isLoading: boolean;
  lastGeneratedAt: string | null;
  detectedDomain: GuidancePrimaryDomain | null;
  activeMode: GuidanceModeId | null;
  shouldOfferDossier: boolean;
}

export interface GuidanceExecutionProgressPresentation {
  eyebrow: string;
  title: string;
  summary: string;
  checkpoints: string[];
}

export interface GuidanceExecutionHandoffPresentation {
  title: string;
  understood: string;
  nextStep: string;
  afterThis: string;
  supportingTaskCount: number;
}

export interface GuidanceExecutionTransitionPresentation {
  title: string;
  continueLabel: string;
  continueSummary: string;
  dossierLabel: string;
  dossierSummary: string;
  nextStep: string;
  supportingTaskCount: number;
}

export interface GuidanceExecutionReadySectionPresentation {
  progress: GuidanceExecutionProgressPresentation;
  handoff: GuidanceExecutionHandoffPresentation;
  transition: GuidanceExecutionTransitionPresentation;
}

export interface GuidanceTrainerNextPathPresentation {
  guidanceSession: GuidanceSession | null;
  activeTrainer: AITrainerId | null;
  trainerLoading: AITrainerId | null;
}

export interface GuidanceTrainerResponsePresentation {
  response: AITrainerResponseOutput | null;
  error: string | null;
  loadingTrainer: AITrainerId | null;
}

export interface GuidanceTrainerSectionPresentation {
  nextPath: GuidanceTrainerNextPathPresentation;
  response: GuidanceTrainerResponsePresentation;
}

export interface GuidanceRightRailViewModel {
  onboardingSession: GuidanceSession | null;
  executionSession: GuidanceSession | null;
  executionReadySection: GuidanceExecutionReadySectionPresentation | null;
  structuredContracts: GuidanceStructuredContractsPresentation;
  result: {
    currentRead: GuidanceCurrentReadPresentation;
    panel: GuidanceResultPanelPresentation;
  };
  trainer: GuidanceTrainerSectionPresentation;
}

export interface GuidanceSessionPresentation {
  intake: GuidanceIntakePresentation;
  progressMessage: GuidanceProgressMessagePresentation;
  surfaceVariant: GuidanceSurfaceVariant;
  rightRailProfile: GuidanceRightRailProfilePresentation;
  activeFocus: GuidanceActiveFocusPresentation;
  sectionVisibility: GuidanceSectionVisibilityPresentation;
  contentDensity: GuidanceContentDensityPresentation;
  microcopyIntent: GuidanceMicrocopyIntentPresentation;
  sectionOutcome: GuidanceSectionOutcomePresentation;
  surfaceRhythm: GuidanceSurfaceRhythmPresentation;
  transitionContinuity: GuidanceTransitionContinuityPresentation;
  visualWeight: GuidanceVisualWeightPresentation;
  zoneProfiles: GuidanceZoneProfilesPresentation;
  rightRailView: GuidanceRightRailViewModel;
}
