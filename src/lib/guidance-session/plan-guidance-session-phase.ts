import {
  type GuidanceOnboardingState,
  type GuidanceProgressionSnapshot,
  type GuidanceRouteOutcome,
  type GuidanceSessionPhase,
} from '@/src/lib/guidance-session/types';

interface GuidancePhaseInput {
  routeOutcome?: GuidanceRouteOutcome;
  onboardingState?: GuidanceOnboardingState;
  hasFollowUpHistory: boolean;
  hasFollowUpQuestion: boolean;
}

export function planGuidanceSessionPhase(input: GuidancePhaseInput): GuidanceSessionPhase {
  if (input.hasFollowUpQuestion || input.onboardingState === 'intro_plus_followup') {
    return 'clarifying';
  }

  if (
    input.routeOutcome?.type === 'convert_to_dossier'
    || input.onboardingState === 'direct_next_step'
    || (input.hasFollowUpHistory && input.routeOutcome?.type === 'continue_in_mode')
  ) {
    return 'execution_ready';
  }

  return 'refined_direction';
}

export function buildGuidanceProgressionSnapshot(input: GuidancePhaseInput): GuidanceProgressionSnapshot {
  const phase = planGuidanceSessionPhase(input);

  return {
    phase,
    phaseLabel: phase.replace(/_/g, ' '),
    phaseSummary: describePhase(phase, input.hasFollowUpHistory),
    hasFollowUpHistory: input.hasFollowUpHistory,
    showsFollowUp: input.hasFollowUpQuestion,
    showsNextStep:
      input.onboardingState === 'intro_plus_next_step'
      || input.onboardingState === 'direct_next_step'
      || phase !== 'clarifying',
  };
}

function describePhase(phase: GuidanceSessionPhase, hasFollowUpHistory: boolean) {
  switch (phase) {
    case 'clarifying':
      return hasFollowUpHistory
        ? 'The system is still tightening one last missing detail before it commits to the strongest direction.'
        : 'The system is clarifying the situation before it pushes you into a heavier path.';
    case 'refined_direction':
      return hasFollowUpHistory
        ? 'The direction is now more grounded and personal, and the system is guiding from that refined read.'
        : 'The system has enough shape to guide you with a clearer direction without forcing execution too early.';
    case 'execution_ready':
      return hasFollowUpHistory
        ? 'The system has enough signal now to move from understanding into committed action.'
        : 'The system sees a clear enough path to move you into real action without extra clarification.';
  }
}
