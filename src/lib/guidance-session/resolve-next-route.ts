import { type GuidanceSession, type GuidanceRouteOutcome } from '@/src/lib/guidance-session/types';
import { adaptGuidanceSessionToDecisionInput } from '@/src/lib/recommendations/adapters/from-guidance-session';
import { resolveRouteDecision } from '@/src/lib/recommendations/core';

export function resolveNextGuidanceRoute(session: GuidanceSession): GuidanceRouteOutcome {
  const decision = resolveRouteDecision(adaptGuidanceSessionToDecisionInput(session));

  if ('kind' in decision && decision.kind === 'gated_pre_result') {
    return {
      type: 'stay_in_guidance',
      reason: 'No guidance result exists yet, so the session should remain in the guidance loop.',
      confidenceLabel: 'guarded',
      rationaleSummary: 'A route recommendation will become clearer after the first guidance read.',
      activeMode: session.activeMode,
    };
  }

  return decision as GuidanceRouteOutcome;
}
