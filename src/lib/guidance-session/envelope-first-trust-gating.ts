import { type GuidanceSession } from '@/src/lib/guidance-session/types';
import {
  getGuidanceDecisionAuthority,
  isGuidanceDecisionDegraded,
  getGuidanceSafeUiCapabilities,
  canRenderGuidanceOnboardingShell,
  canRenderGuidanceFollowUpInput,
  canRenderGuidanceTrainerRecommendation,
  canRenderGuidanceExecutionBridge,
  canRenderGuidancePhaseProgression,
} from '@/src/lib/guidance-session/guidance-decision-envelope';

/**
 * Envelope-first trust gating utilities for consumers
 * 
 * These utilities provide a consistent way for UI components to respect
 * the decision envelope's authority and safe UI capabilities.
 * 
 * Key principles:
 * 1. Always check decision authority before field access
 * 2. Respect explicit safeUiCapabilities gating
 * 3. Degrade gracefully when trust is reduced
 * 4. Prefer envelope fields over legacy mirrored fields
 */

export interface EnvelopeFirstTrustState {
  authority: ReturnType<typeof getGuidanceDecisionAuthority>;
  isDegraded: boolean;
  safeUiCapabilities: ReturnType<typeof getGuidanceSafeUiCapabilities>;
  hasAuthoritativeEnvelope: boolean;
}

export interface EnvelopeFirstCapabilityGates {
  canShowOnboardingShell: boolean;
  canShowFollowUpInput: boolean;
  canShowTrainerRecommendation: boolean;
  canShowExecutionBridge: boolean;
  canShowPhaseProgression: boolean;
}

/**
 * Get the trust state for a guidance session
 * Returns authority information and degradation status
 */
export function getEnvelopeFirstTrustState(
  session: GuidanceSession | null | undefined
): EnvelopeFirstTrustState {
  const authority = getGuidanceDecisionAuthority(session);
  const isDegraded = isGuidanceDecisionDegraded(session);
  const safeUiCapabilities = getGuidanceSafeUiCapabilities(session);
  const hasAuthoritativeEnvelope = Boolean(authority && authority.level === 'authoritative');

  return {
    authority,
    isDegraded: isDegraded ?? false,
    safeUiCapabilities,
    hasAuthoritativeEnvelope,
  };
}

/**
 * Get capability gates for a guidance session
 * Respects safeUiCapabilities and authority degradation
 */
export function getEnvelopeFirstCapabilityGates(
  session: GuidanceSession | null | undefined
): EnvelopeFirstCapabilityGates {
  const trustState = getEnvelopeFirstTrustState(session);
  const capabilities = trustState.safeUiCapabilities;

  // When explicitly degraded, limit to basic functionality
  if (trustState.isDegraded) {
    return {
      canShowOnboardingShell: canRenderGuidanceOnboardingShell(session),
      canShowFollowUpInput: false,
      canShowTrainerRecommendation: false,
      canShowExecutionBridge: false,
      canShowPhaseProgression: false,
    };
  }

  // When no envelope but not degraded, use legacy behavior (allow capabilities based on field presence)
  if (!capabilities) {
    return {
      canShowOnboardingShell: canRenderGuidanceOnboardingShell(session),
      canShowFollowUpInput: canRenderGuidanceFollowUpInput(session),
      canShowTrainerRecommendation: canRenderGuidanceTrainerRecommendation(session),
      canShowExecutionBridge: canRenderGuidanceExecutionBridge(session),
      canShowPhaseProgression: canRenderGuidancePhaseProgression(session),
    };
  }

  // When authoritative, respect explicit capability flags
  return {
    canShowOnboardingShell: capabilities.onboardingShell && canRenderGuidanceOnboardingShell(session),
    canShowFollowUpInput: capabilities.followUpInput && canRenderGuidanceFollowUpInput(session),
    canShowTrainerRecommendation: capabilities.trainerRecommendation && canRenderGuidanceTrainerRecommendation(session),
    canShowExecutionBridge: capabilities.executionBridge && canRenderGuidanceExecutionBridge(session),
    canShowPhaseProgression: capabilities.phaseProgression && canRenderGuidancePhaseProgression(session),
  };
}

/**
 * Check if a session should render degraded-safe UI
 * Returns true when authority is degraded or missing
 */
export function shouldRenderDegradedSafeUI(
  session: GuidanceSession | null | undefined
): boolean {
  const trustState = getEnvelopeFirstTrustState(session);
  return trustState.isDegraded || !trustState.hasAuthoritativeEnvelope;
}

/**
 * Get safe trainer recommendation for rendering
 * Returns undefined when trust is degraded or capability is blocked
 */
export function getSafeTrainerRecommendation(
  session: GuidanceSession | null | undefined
) {
  const gates = getEnvelopeFirstCapabilityGates(session);
  if (!gates.canShowTrainerRecommendation) {
    return undefined;
  }

  // Use envelope-first field access
  return session?.decision?.trainerRecommendation ?? session?.trainerRecommendation;
}

/**
 * Get safe follow-up question for rendering
 * Returns undefined when trust is degraded or capability is blocked
 */
export function getSafeFollowUpQuestion(
  session: GuidanceSession | null | undefined
) {
  const gates = getEnvelopeFirstCapabilityGates(session);
  if (!gates.canShowFollowUpInput) {
    return undefined;
  }

  // Use envelope-first field access
  return session?.decision?.followUpQuestion ?? session?.followUpQuestion;
}

/**
 * Get safe execution readiness for rendering
 * Returns degraded state when trust is reduced
 */
export function getSafeExecutionReadiness(
  session: GuidanceSession | null | undefined
) {
  const gates = getEnvelopeFirstCapabilityGates(session);
  const trustState = getEnvelopeFirstTrustState(session);

  if (!gates.canShowExecutionBridge || trustState.isDegraded) {
    return {
      isReady: false,
      reason: trustState.isDegraded ? 'degraded_authority' : 'capability_blocked',
    };
  }

  // Use envelope-first field access
  return session?.decision?.executionReadiness ?? {
    isReady: false,
    reason: 'missing_envelope',
  };
}

/**
 * Authority-aware content filtering
 * Filters content based on trust level and capabilities
 */
export function filterContentByAuthority<T>(
  content: T,
  session: GuidanceSession | null | undefined,
  options: {
    requireAuthoritative?: boolean;
    allowedInDegraded?: boolean;
    capability?: keyof EnvelopeFirstCapabilityGates;
  } = {}
): T | undefined {
  const trustState = getEnvelopeFirstTrustState(session);
  const gates = getEnvelopeFirstCapabilityGates(session);

  // Check authority requirements
  if (options.requireAuthoritative && !trustState.hasAuthoritativeEnvelope) {
    return undefined;
  }

  // Check degradation allowance
  if (!options.allowedInDegraded && trustState.isDegraded) {
    return undefined;
  }

  // Check specific capability
  if (options.capability && !gates[options.capability]) {
    return undefined;
  }

  return content;
}
