import { getInitialDossierPhase } from '@/src/lib/dossiers/build-generated-dossier';
import { createGuidanceSession } from '@/src/lib/guidance-session/create-session';
import {
  applyGuidanceDecisionEnvelope,
  buildAuthoritativeGuidanceDecisionEnvelope,
  createGuidanceDecisionEnvelopeFromSession,
} from '@/src/lib/guidance-session/guidance-decision-envelope';
import {
  type GuidanceContinuation,
  type GuidanceSession,
  type GuidanceSessionResult,
} from '@/src/lib/guidance-session/types';
import {
  buildGuidanceProgressionSnapshot,
  planGuidanceSessionPhase,
} from '@/src/lib/guidance-session/plan-guidance-session-phase';
import { adaptGuidanceSessionToDecisionInput } from '@/src/lib/recommendations/adapters/from-guidance-session';
import { planFollowUpQuestion } from '@/src/lib/recommendations/core';
import { resolveNextGuidanceRoute } from '@/src/lib/guidance-session/resolve-next-route';
import { planOnboardingState } from '@/src/lib/guidance-session/plan-onboarding-state';
import { resolveTrainerRecommendations } from '@/src/lib/trainers/resolve-trainer-recommendations';

export function buildFirstPassGuidanceSession(
  session: GuidanceSession,
  result: GuidanceSessionResult
): GuidanceSession {
  const baseSession = createGuidanceSession({
    initialInput: session.initialInput,
    intakeAnswers: session.intakeAnswers,
    detectedDomain: session.detectedDomain,
    domainConfidence: session.domainConfidence,
    activeMode: session.activeMode,
    characterProfile: session.characterProfile,
    progressionState: session.progressionState,
    shouldOfferDossier: session.shouldOfferDossier,
    linkedDossierId: session.linkedDossierId,
    createdAt: session.createdAt,
    result,
  });

  const routeOutcome = resolveNextGuidanceRoute(baseSession);
  const trainerRecommendation = resolveTrainerRecommendations({
    phase: getInitialDossierPhase(baseSession.activeMode),
    totalTasks: result.suggestedTasks.length,
    completedCount: 0,
    currentObjective: result.nextStep,
    currentGuidanceSummary: result.summary,
    currentGuidanceNextStep: result.nextStep,
    activeMode: baseSession.activeMode,
    detectedDomain: baseSession.detectedDomain,
    domainConfidence: baseSession.domainConfidence,
    characterProfile: baseSession.characterProfile,
    progressionState: baseSession.progressionState,
  });
  const followUpQuestion = planFollowUpQuestion(adaptGuidanceSessionToDecisionInput(baseSession));
  const onboardingState = planOnboardingState({
    routeOutcome,
    followUpQuestion: followUpQuestion ?? undefined,
    characterProfile: baseSession.characterProfile,
    progressionState: baseSession.progressionState,
  });
  const hasFollowUpHistory = Object.keys(baseSession.intakeAnswers ?? {}).some((key) => key.startsWith('follow_up_'));
  const phase = planGuidanceSessionPhase({
    routeOutcome,
    onboardingState,
    hasFollowUpHistory,
    hasFollowUpQuestion: Boolean(followUpQuestion),
  });
  const progressionSnapshot = buildGuidanceProgressionSnapshot({
    routeOutcome,
    onboardingState,
    hasFollowUpHistory,
    hasFollowUpQuestion: Boolean(followUpQuestion),
  });
  const decision = buildAuthoritativeGuidanceDecisionEnvelope({
    session: baseSession,
    routeOutcome,
    trainerRecommendation,
    followUpQuestion: followUpQuestion ?? undefined,
    onboardingState,
    phase,
    progressionSnapshot,
    authoritySource: 'server_first_pass',
  });

  return applyGuidanceDecisionEnvelope({
    ...baseSession,
    routeOutcome,
    trainerRecommendation,
    followUpQuestion: followUpQuestion ?? undefined,
    onboardingState,
    phase,
    progressionSnapshot,
    characterProfile: baseSession.characterProfile,
    progressionState: baseSession.progressionState,
    trainerResponse: undefined,
    decision,
  }, decision);
}

export function toGuidanceContinuation(session: GuidanceSession): GuidanceContinuation {
  if (!session.routeOutcome || !session.trainerRecommendation) {
    throw new Error('First-pass continuation requires both routeOutcome and trainerRecommendation.');
  }
  const decision = session.decision ?? createGuidanceDecisionEnvelopeFromSession(session, {
    authoritySource: 'server_first_pass',
  });

  return {
    decision,
    detectedDomain: session.detectedDomain,
    activeMode: session.activeMode,
    shouldOfferDossier: session.shouldOfferDossier,
    routeOutcome: session.routeOutcome,
    trainerRecommendation: session.trainerRecommendation,
    ...(session.followUpQuestion ? { followUpQuestion: session.followUpQuestion } : {}),
    ...(session.characterProfile ? { characterProfile: session.characterProfile } : {}),
    ...(session.progressionState ? { progressionState: session.progressionState } : {}),
  };
}
