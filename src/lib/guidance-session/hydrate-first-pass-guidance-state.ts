import { buildFirstPassGuidanceSession } from '@/src/lib/guidance-session/build-first-pass-guidance-session';
import { createGuidanceSession } from '@/src/lib/guidance-session/create-session';
import {
  applyGuidanceDecisionEnvelope,
  buildAuthoritativeGuidanceDecisionEnvelope,
  createGuidanceDecisionEnvelopeFromSession,
  degradeGuidanceDecisionEnvelope,
} from '@/src/lib/guidance-session/guidance-decision-envelope';
import {
  type GuidanceContinuation,
  type GuidanceSession,
  type GuidanceSessionResult,
} from '@/src/lib/guidance-session/types';
import { type GuidancePrimaryDomain } from '@/src/lib/ai/domain/types';
import { type GuidanceModeId } from '@/src/lib/ai/modes/types';

interface HydrateGuidanceStateInput {
  rawInput: string;
  intakeAnswers: Record<string, string>;
  result: GuidanceSessionResult;
  continuation?: GuidanceContinuation;
  fallbackDetectedDomain?: GuidancePrimaryDomain;
  fallbackActiveMode?: GuidanceModeId;
  fallbackShouldOfferDossier?: boolean;
}

interface HydrateGuidanceStateDependencies {
  createSession?: typeof createGuidanceSession;
  buildFirstPassSession?: typeof buildFirstPassGuidanceSession;
}

export function hydrateFirstPassGuidanceState(
  input: HydrateGuidanceStateInput,
  dependencies: HydrateGuidanceStateDependencies = {}
): {
  guidanceSession: GuidanceSession;
  resultMeta: {
    detectedDomain: GuidancePrimaryDomain;
    activeMode: GuidanceModeId;
    shouldOfferDossier: boolean;
  } | null;
  usedAuthoritativeContinuation: boolean;
} {
  const createSession = dependencies.createSession ?? createGuidanceSession;
  const buildFirstPassSession = dependencies.buildFirstPassSession ?? buildFirstPassGuidanceSession;

  if (input.continuation) {
    const baseSession = createSession({
      initialInput: input.rawInput,
      intakeAnswers: input.intakeAnswers,
      detectedDomain: input.continuation.detectedDomain,
      activeMode: input.continuation.activeMode,
      characterProfile: input.continuation.characterProfile,
      progressionState: input.continuation.progressionState,
      shouldOfferDossier: input.continuation.shouldOfferDossier,
      result: input.result,
    });
    const decision = input.continuation.decision
      ? buildAuthoritativeGuidanceDecisionEnvelope({
        session: {
          ...baseSession,
          characterProfile: input.continuation.characterProfile ?? baseSession.characterProfile,
          progressionState: input.continuation.progressionState ?? baseSession.progressionState,
        },
        routeOutcome: input.continuation.decision.routeOutcome ?? input.continuation.routeOutcome,
        trainerRecommendation: input.continuation.decision.trainerRecommendation ?? input.continuation.trainerRecommendation,
        followUpQuestion: input.continuation.decision.followUpQuestion ?? input.continuation.followUpQuestion,
        onboardingState: input.continuation.decision.onboardingState,
        phase: input.continuation.decision.phase,
        progressionSnapshot: input.continuation.decision.progressionSnapshot,
        authoritySource: 'server_continuation',
      })
      : degradeGuidanceDecisionEnvelope(
        buildAuthoritativeGuidanceDecisionEnvelope({
          session: {
            ...baseSession,
            characterProfile: input.continuation.characterProfile ?? baseSession.characterProfile,
            progressionState: input.continuation.progressionState ?? baseSession.progressionState,
          },
          routeOutcome: input.continuation.routeOutcome,
          trainerRecommendation: input.continuation.trainerRecommendation,
          followUpQuestion: input.continuation.followUpQuestion,
          onboardingState: undefined,
          phase: undefined,
          progressionSnapshot: undefined,
          authoritySource: 'server_continuation',
        }),
        {
          source: 'client_fallback_legacy_continuation',
          degradedReason: 'legacy_continuation_contract',
        }
      );
    const guidanceSession = applyGuidanceDecisionEnvelope({
      ...baseSession,
      characterProfile: input.continuation.characterProfile ?? baseSession.characterProfile,
      progressionState: input.continuation.progressionState ?? baseSession.progressionState,
      trainerResponse: undefined,
      decision,
    }, decision);

    return {
      guidanceSession,
      resultMeta: {
        detectedDomain: guidanceSession.decision?.domain.primary ?? input.continuation.detectedDomain,
        activeMode: guidanceSession.decision?.mode.active ?? input.continuation.activeMode,
        shouldOfferDossier: guidanceSession.decision?.domain.shouldOfferDossier ?? input.continuation.shouldOfferDossier,
      },
      usedAuthoritativeContinuation: Boolean(input.continuation.decision),
    };
  }

  if (!input.fallbackDetectedDomain || !input.fallbackActiveMode || input.fallbackShouldOfferDossier === undefined) {
    const fallbackSession = createSession({
      initialInput: input.rawInput,
      intakeAnswers: input.intakeAnswers,
      result: input.result,
    });
    const recomputedSession = buildFirstPassSession(fallbackSession, input.result);
    const degradedDecision = degradeGuidanceDecisionEnvelope(
      createGuidanceDecisionEnvelopeFromSession(recomputedSession, {
        authoritySource: 'server_first_pass',
      }),
      {
        source: 'client_fallback_recomputed',
        degradedReason: 'missing_authoritative_continuation',
      }
    );

    return {
      guidanceSession: applyGuidanceDecisionEnvelope(
        {
          ...recomputedSession,
          decision: degradedDecision,
        },
        degradedDecision
      ),
      resultMeta: null,
      usedAuthoritativeContinuation: false,
    };
  }

  const fallbackSession = createSession({
    initialInput: input.rawInput,
    intakeAnswers: input.intakeAnswers,
    detectedDomain: input.fallbackDetectedDomain,
    activeMode: input.fallbackActiveMode,
    shouldOfferDossier: input.fallbackShouldOfferDossier,
    result: input.result,
  });
  const recomputedSession = buildFirstPassSession(fallbackSession, input.result);
  const degradedDecision = degradeGuidanceDecisionEnvelope(
    createGuidanceDecisionEnvelopeFromSession(recomputedSession, {
      authoritySource: 'server_first_pass',
    }),
    {
      source: 'client_fallback_recomputed',
      degradedReason: 'missing_authoritative_continuation',
    }
  );

  return {
    guidanceSession: applyGuidanceDecisionEnvelope(
      {
        ...recomputedSession,
        decision: degradedDecision,
      },
      degradedDecision
    ),
    resultMeta: {
      detectedDomain: input.fallbackDetectedDomain,
      activeMode: input.fallbackActiveMode,
      shouldOfferDossier: input.fallbackShouldOfferDossier,
    },
    usedAuthoritativeContinuation: false,
  };
}
