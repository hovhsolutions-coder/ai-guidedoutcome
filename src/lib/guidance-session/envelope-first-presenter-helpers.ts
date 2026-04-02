/**
 * Envelope-first presenter helpers
 * 
 * Centralized utilities for presenter layer that respect envelope-first
 * trust boundaries and provide safe fallbacks for legacy field access.
 * 
 * Key principles:
 * 1. Presenters should render from envelope-first view models, not invent trust logic
 * 2. Trust helpers decide what is allowed/trusted, view-model builders decide what gets built
 * 3. Components should use these helpers instead of inline authority heuristics
 * 4. Legacy-compatible fallbacks are explicit and clearly transitional
 */

import {
  getEnvelopeFirstTrustState,
  getEnvelopeFirstCapabilityGates,
  getSafeExecutionReadiness,
  getSafeTrainerRecommendation,
  getSafeFollowUpQuestion,
  filterContentByAuthority,
} from './envelope-first-trust-gating';
import {
  createEnvelopeFirstSessionAccess,
  buildEnvelopeFirstExecutionReadySection,
} from './envelope-first-view-model-builders';
import {
  canRenderGuidanceOnboardingShell,
  canRenderGuidanceExecutionBridge,
  getGuidanceSessionProgressionSnapshot,
  getGuidanceSessionRouteOutcome,
  getGuidanceSessionTrainerRecommendation,
  getGuidanceSessionFollowUpQuestion,
  getGuidanceSessionOnboardingState,
  getGuidanceSessionPhase,
} from './guidance-decision-envelope';
import {
  buildGuidanceCopyProfile,
  getGuidanceDomainLexicon,
} from '@/src/components/guidance/guidance-copy-personalization';
import { getGuidanceModeConfig } from '@/src/lib/ai/modes/mode-config';
import {
  type GuidanceSession,
  type GuidanceSessionResult,
} from './types';
import { type GuidancePrimaryDomain } from '@/src/lib/ai/domain/types';
import { type GuidanceModeId } from '@/src/lib/ai/modes/types';
import {
  type GuidanceRightRailViewModel,
  type GuidanceTrainerSectionPresentation,
  type GuidanceResultPanelPresentation,
} from '@/src/components/guidance/guidance-presentation-contracts';
import { type AIResponseOutput, type AITrainerId } from '@/src/lib/ai/types';

/**
 * Envelope-first presenter context that provides safe access to session data
 * with explicit trust boundaries and capability gating.
 */
export interface EnvelopeFirstPresenterContext {
  session: GuidanceSession | null;
  trustState: ReturnType<typeof getEnvelopeFirstTrustState>;
  capabilityGates: ReturnType<typeof getEnvelopeFirstCapabilityGates>;
  
  // Safe envelope-first accessors
  progressionSnapshot: ReturnType<typeof getGuidanceSessionProgressionSnapshot>;
  executionReadiness: ReturnType<typeof getSafeExecutionReadiness>;
  trainerRecommendation: ReturnType<typeof getSafeTrainerRecommendation>;
  followUpQuestion: ReturnType<typeof getSafeFollowUpQuestion>;
  onboardingState: ReturnType<typeof getGuidanceSessionOnboardingState>;
  phase: ReturnType<typeof getGuidanceSessionPhase>;
  routeOutcome: ReturnType<typeof getGuidanceSessionRouteOutcome>;
  
  // Legacy-compatible field access (explicitly marked as transitional)
  result: GuidanceSession['result'];
  initialInput: string;
  detectedDomain: GuidancePrimaryDomain | null;
  activeMode: GuidanceModeId | null;
  intakeAnswers: GuidanceSession['intakeAnswers'];
  shouldOfferDossier: boolean;
  
  // Computed helpers
  copyProfile: ReturnType<typeof buildGuidanceCopyProfile>;
  lexicon: ReturnType<typeof getGuidanceDomainLexicon>;
  modeConfig: ReturnType<typeof getGuidanceModeConfig> | null;
}

/**
 * Creates an envelope-first presenter context with safe field access
 */
export function createEnvelopeFirstPresenterContext(
  session: GuidanceSession | null
): EnvelopeFirstPresenterContext | null {
  if (!session) {
    return null;
  }

  const trustState = getEnvelopeFirstTrustState(session);
  const capabilityGates = getEnvelopeFirstCapabilityGates(session);

  // Envelope-first validation: only proceed if we have authority or legacy data
  if (!trustState.authority && !session.result && !session.trainerRecommendation) {
    return null;
  }

  const detectedDomain = session.detectedDomain;
  const activeMode = session.activeMode;
  
  const copyProfile = buildGuidanceCopyProfile({
    rawInput: session.initialInput,
    detectedDomain,
    activeMode,
    intakeAnswers: session.intakeAnswers,
  });
  
  const lexicon = getGuidanceDomainLexicon(copyProfile);
  const modeConfig = activeMode ? getGuidanceModeConfig(activeMode) : null;

  return {
    session,
    trustState,
    capabilityGates,
    
    // Safe envelope-first accessors
    progressionSnapshot: getGuidanceSessionProgressionSnapshot(session),
    executionReadiness: getSafeExecutionReadiness(session),
    trainerRecommendation: getSafeTrainerRecommendation(session),
    followUpQuestion: getSafeFollowUpQuestion(session),
    onboardingState: getGuidanceSessionOnboardingState(session),
    phase: getGuidanceSessionPhase(session),
    routeOutcome: getGuidanceSessionRouteOutcome(session),
    
    // Legacy-compatible field access (explicitly marked as transitional)
    result: session.result,
    initialInput: session.initialInput,
    detectedDomain,
    activeMode,
    intakeAnswers: session.intakeAnswers,
    shouldOfferDossier: session.shouldOfferDossier,
    
    // Computed helpers
    copyProfile,
    lexicon,
    modeConfig,
  };
}

/**
 * Builds envelope-first result panel presentation with authority-aware content filtering
 */
export function buildEnvelopeFirstResultPanelPresentation(
  context: EnvelopeFirstPresenterContext,
  legacyPanel: GuidanceResultPanelPresentation,
  isLoading: boolean,
  lastGeneratedAt: string | null
): GuidanceResultPanelPresentation {
  // Envelope-first content filtering for result data
  const filteredResult = context.result ? filterContentByAuthority(
    context.result,
    context.session,
    { requireAuthoritative: false, allowedInDegraded: true }
  ) : null;

  return {
    result: filteredResult as AIResponseOutput | null,
    isLoading,
    lastGeneratedAt,
    detectedDomain: context.detectedDomain,
    activeMode: context.activeMode,
    shouldOfferDossier: context.shouldOfferDossier,
  };
}

/**
 * Builds envelope-first trainer section presentation with capability gating
 */
export function buildEnvelopeFirstTrainerSectionPresentation(
  context: EnvelopeFirstPresenterContext,
  activeTrainer: AITrainerId | null,
  trainerLoading: AITrainerId | null,
  trainerError: string | null
): GuidanceTrainerSectionPresentation | null {
  // Don't create trainer section if there's no guidance session
  if (!context.session) {
    return null;
  }

  // Don't create trainer section if execution-ready section would be shown
  // Execution-ready state should show execution transition, not trainer options
  // But only if execution capabilities are available
  if (context.session.routeOutcome?.type === 'convert_to_dossier' && 
      context.capabilityGates.canShowExecutionBridge) {
    return null;
  }

  return {
    nextPath: {
      guidanceSession: context.session,
      activeTrainer,
      trainerLoading,
    },
    response: {
      response: context.session?.trainerResponse ?? null,
      error: trainerError,
      loadingTrainer: trainerLoading,
    },
  };
}

/**
 * Determines if trainer content should be prioritized based on envelope-first authority
 */
export function shouldPrioritizeTrainerContent(
  context: EnvelopeFirstPresenterContext,
  outcome: string,
  trainerResponse: any,
  trainerError: string | null,
  loadingTrainer: AITrainerId | null
): boolean {
  // Legacy logic preserved but with envelope-first safety
  const hasTrainerActivity = loadingTrainer !== null || trainerError !== null || trainerResponse !== null;
  
  // Envelope-first: if we have any envelope (authoritative or degraded), respect capability gates
  if (context.trustState.authority) {
    return outcome === 'explore' && hasTrainerActivity && context.capabilityGates.canShowTrainerRecommendation;
  }
  
  // Legacy fallback: if no envelope, use legacy logic
  return outcome === 'explore' && hasTrainerActivity;
}

/**
 * Builds envelope-first safe result content with authority filtering
 */
export function buildEnvelopeFirstSafeResultContent(
  context: EnvelopeFirstPresenterContext
): {
  summary: string | null;
  nextStep: string | null;
  suggestedTasks: string[] | null;
  isDegraded: boolean;
} {
  if (!context.result) {
    return {
      summary: null,
      nextStep: null,
      suggestedTasks: null,
      isDegraded: context.trustState.isDegraded,
    };
  }

  // Apply envelope-first content filtering
  const filteredResult = filterContentByAuthority(
    context.result,
    context.session,
    { 
      requireAuthoritative: false, 
      allowedInDegraded: true
    }
  );

  if (!filteredResult) {
    return {
      summary: null,
      nextStep: null,
      suggestedTasks: null,
      isDegraded: true, // Content was filtered due to authority
    };
  }

  return {
    summary: filteredResult.summary,
    nextStep: filteredResult.nextStep,
    suggestedTasks: filteredResult.suggestedTasks,
    isDegraded: context.trustState.isDegraded,
  };
}

/**
 * Legacy compatibility wrapper for existing presenter patterns
 * 
 * This provides a migration path for existing presenter code that expects
 * the old direct field access pattern.
 */
export function createLegacyCompatiblePresenterContext(
  session: GuidanceSession | null
): Omit<EnvelopeFirstPresenterContext, 'trustState' | 'capabilityGates'> | null {
  const context = createEnvelopeFirstPresenterContext(session);
  if (!context) {
    return null;
  }

  // Return only the legacy-compatible fields for migration
  return {
    session: context.session,
    progressionSnapshot: context.progressionSnapshot,
    executionReadiness: context.executionReadiness,
    trainerRecommendation: context.trainerRecommendation,
    followUpQuestion: context.followUpQuestion,
    onboardingState: context.onboardingState,
    phase: context.phase,
    routeOutcome: context.routeOutcome,
    result: context.result,
    initialInput: context.initialInput,
    detectedDomain: context.detectedDomain,
    activeMode: context.activeMode,
    intakeAnswers: context.intakeAnswers,
    shouldOfferDossier: context.shouldOfferDossier,
    copyProfile: context.copyProfile,
    lexicon: context.lexicon,
    modeConfig: context.modeConfig,
  };
}
