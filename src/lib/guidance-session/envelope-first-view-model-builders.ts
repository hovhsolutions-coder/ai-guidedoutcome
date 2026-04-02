/**
 * Envelope-first view model builders
 * 
 * Centralized utilities for building view models that respect envelope-first
 * trust boundaries and provide safe fallbacks for legacy field access.
 * 
 * Key principles:
 * 1. Always use envelope-first trust gating before field access
 * 2. Provide safe fallbacks for legacy mirror fields when envelope absent
 * 3. Centralize capability checks to avoid duplicated heuristics
 * 4. Make legacy field access explicit and transitional
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
  canRenderGuidanceExecutionBridge,
  canRenderGuidanceOnboardingShell,
  getGuidanceSessionProgressionSnapshot,
  getGuidanceSessionRouteOutcome,
  getGuidanceSessionExecutionReadiness,
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
  type GuidanceExecutionProgressPresentation,
  type GuidanceExecutionHandoffPresentation,
  type GuidanceExecutionTransitionPresentation,
  type GuidanceExecutionReadySectionPresentation,
} from '@/src/components/guidance/guidance-presentation-contracts';
import { type GuidanceSession } from './types';

/**
 * Envelope-first session wrapper that provides safe field access
 * with explicit fallback to legacy mirrors when envelope is absent.
 */
export interface EnvelopeFirstSessionAccess {
  session: GuidanceSession;
  trustState: ReturnType<typeof getEnvelopeFirstTrustState>;
  capabilityGates: ReturnType<typeof getEnvelopeFirstCapabilityGates>;
  
  // Envelope-first field access with legacy fallback
  result: GuidanceSession['result'];
  initialInput: string;
  detectedDomain: GuidanceSession['detectedDomain'];
  activeMode: GuidanceSession['activeMode'];
  intakeAnswers: GuidanceSession['intakeAnswers'];
  shouldOfferDossier: boolean;
  
  // Safe envelope-first accessors
  progressionSnapshot: ReturnType<typeof getGuidanceSessionProgressionSnapshot>;
  executionReadiness: ReturnType<typeof getSafeExecutionReadiness>;
  trainerRecommendation: ReturnType<typeof getSafeTrainerRecommendation>;
  followUpQuestion: ReturnType<typeof getSafeFollowUpQuestion>;
  onboardingState: ReturnType<typeof getGuidanceSessionOnboardingState>;
  phase: ReturnType<typeof getGuidanceSessionPhase>;
  routeOutcome: ReturnType<typeof getGuidanceSessionRouteOutcome>;
}

/**
 * Creates an envelope-first session access wrapper
 */
export function createEnvelopeFirstSessionAccess(
  session: GuidanceSession | null
): EnvelopeFirstSessionAccess | null {
  if (!session) {
    return null;
  }

  const trustState = getEnvelopeFirstTrustState(session);
  const capabilityGates = getEnvelopeFirstCapabilityGates(session);

  // Envelope-first validation: only proceed if we have authority or legacy data
  if (!trustState.authority && !session.result && !session.trainerRecommendation) {
    return null;
  }

  return {
    session,
    trustState,
    capabilityGates,
    
    // Direct legacy field access (explicitly marked as transitional)
    result: session.result,
    initialInput: session.initialInput,
    detectedDomain: session.detectedDomain,
    activeMode: session.activeMode,
    intakeAnswers: session.intakeAnswers,
    shouldOfferDossier: session.shouldOfferDossier,
    
    // Safe envelope-first accessors
    progressionSnapshot: getGuidanceSessionProgressionSnapshot(session),
    executionReadiness: getSafeExecutionReadiness(session),
    trainerRecommendation: getSafeTrainerRecommendation(session),
    followUpQuestion: getSafeFollowUpQuestion(session),
    onboardingState: getGuidanceSessionOnboardingState(session),
    phase: getGuidanceSessionPhase(session),
    routeOutcome: getGuidanceSessionRouteOutcome(session),
  };
}

/**
 * Builds execution progress presentation using envelope-first access
 */
export function buildEnvelopeFirstExecutionProgress(
  sessionAccess: EnvelopeFirstSessionAccess
): GuidanceExecutionProgressPresentation | null {
  // Envelope-first capability check
  if (!sessionAccess.capabilityGates.canShowExecutionBridge) {
    return null;
  }

  const { session, progressionSnapshot, result, initialInput, detectedDomain, activeMode, intakeAnswers, shouldOfferDossier } = sessionAccess;

  if (!progressionSnapshot) {
    return null;
  }

  const copyProfile = buildGuidanceCopyProfile({
    rawInput: initialInput,
    detectedDomain,
    activeMode,
    intakeAnswers,
  });
  const lexicon = getGuidanceDomainLexicon(copyProfile);

  return {
    eyebrow: 'Plan ready',
    title: copyProfile.domainFamily === 'structure'
      ? 'Clarification is complete and the plan is now clear.'
      : 'Clarification is complete and the direction is now clear.',
    summary: `${progressionSnapshot.phaseSummary} This is now grounded enough to carry forward.`,
    checkpoints: [
      'Clarified',
      copyProfile.domainFamily === 'structure' ? 'Plan clear' : 'Direction clear',
      shouldOfferDossier ? 'Ready for mission control' : 'Ready to act',
    ],
  };
}

/**
 * Builds execution handoff presentation using envelope-first access
 */
export function buildEnvelopeFirstExecutionHandoff(
  sessionAccess: EnvelopeFirstSessionAccess
): GuidanceExecutionHandoffPresentation | null {
  // Envelope-first capability check
  if (!sessionAccess.capabilityGates.canShowExecutionBridge) {
    return null;
  }

  const { session, progressionSnapshot, result, initialInput, detectedDomain, activeMode, intakeAnswers } = sessionAccess;

  if (!result) {
    return null;
  }

  const supportingTaskCount = result.suggestedTasks.length;
  const copyProfile = buildGuidanceCopyProfile({
    rawInput: initialInput,
    detectedDomain,
    activeMode,
    intakeAnswers,
  });

  return {
    title: 'Execution handoff',
    understood: progressionSnapshot?.phaseSummary ?? result.summary,
    nextStep: result.nextStep,
    afterThis: supportingTaskCount > 0
      ? `After this move, use the ${supportingTaskCount} supporting task${supportingTaskCount === 1 ? '' : 's'} to keep momentum without reopening the same analysis loop. Nothing from the clarified route is lost.`
      : `After this move, continue forward from the same ${copyProfile.domainFamily === 'structure' ? 'plan' : copyProfile.domainFamily === 'clarity' ? 'position' : 'direction'} instead of reopening the read from scratch.`,
    supportingTaskCount,
  };
}

/**
 * Builds execution transition presentation using envelope-first access
 */
export function buildEnvelopeFirstExecutionTransition(
  sessionAccess: EnvelopeFirstSessionAccess
): GuidanceExecutionTransitionPresentation | null {
  // Envelope-first capability check
  if (!sessionAccess.capabilityGates.canShowExecutionBridge) {
    return null;
  }

  const { session, result, initialInput, detectedDomain, activeMode, intakeAnswers } = sessionAccess;

  if (!result) {
    return null;
  }

  const supportingTaskCount = result.suggestedTasks.length;
  const copyProfile = buildGuidanceCopyProfile({
    rawInput: initialInput,
    detectedDomain,
    activeMode,
    intakeAnswers,
  });
  const lexicon = getGuidanceDomainLexicon(copyProfile);

  return {
    title: 'Continue forward',
    continueLabel: 'Continue from this guidance state',
    continueSummary: supportingTaskCount > 0
      ? `Keep the current read active, move on the next step, and use the ${supportingTaskCount} supporting task${supportingTaskCount === 1 ? '' : 's'} to sustain execution. This keeps the confirmed route intact.`
      : `Keep the current read active and move directly on the ${lexicon.nextMove} without reopening the same analysis loop.`,
    dossierLabel: 'Convert into dossier when ready',
    dossierSummary: supportingTaskCount > 0
      ? `The current read is ready for mission control with ${supportingTaskCount} supporting task${supportingTaskCount === 1 ? '' : 's'} to track execution. This preserves the clarified route structure.`
      : `The current read is ready for mission control. This preserves the clarified ${copyProfile.domainFamily === 'structure' ? 'plan' : copyProfile.domainFamily === 'clarity' ? 'position' : 'direction'} structure.`,
    nextStep: result.nextStep,
    supportingTaskCount,
  };
}

/**
 * Builds complete execution ready section using envelope-first access
 */
export function buildEnvelopeFirstExecutionReadySection(
  sessionAccess: EnvelopeFirstSessionAccess
): GuidanceExecutionReadySectionPresentation | null {
  const progress = buildEnvelopeFirstExecutionProgress(sessionAccess);
  const handoff = buildEnvelopeFirstExecutionHandoff(sessionAccess);
  const transition = buildEnvelopeFirstExecutionTransition(sessionAccess);

  if (!progress || !handoff || !transition) {
    return null;
  }

  return {
    progress,
    handoff,
    transition,
  };
}

/**
 * Legacy compatibility wrapper for existing view model builders
 * 
 * This provides a migration path for existing code that expects
 * the old direct session access pattern.
 */
export function createLegacyCompatibleSessionAccess(
  session: GuidanceSession | null
): Omit<EnvelopeFirstSessionAccess, 'trustState' | 'capabilityGates'> | null {
  const access = createEnvelopeFirstSessionAccess(session);
  if (!access) {
    return null;
  }

  // Return only the legacy-compatible fields for migration
  return {
    session: access.session,
    result: access.result,
    initialInput: access.initialInput,
    detectedDomain: access.detectedDomain,
    activeMode: access.activeMode,
    intakeAnswers: access.intakeAnswers,
    shouldOfferDossier: access.shouldOfferDossier,
    progressionSnapshot: access.progressionSnapshot,
    executionReadiness: access.executionReadiness,
    trainerRecommendation: access.trainerRecommendation,
    followUpQuestion: access.followUpQuestion,
    onboardingState: access.onboardingState,
    phase: access.phase,
    routeOutcome: access.routeOutcome,
  };
}
