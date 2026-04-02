import {
  type GuidanceOnboardingState,
  type GuidanceRouteOutcome,
} from '@/src/lib/guidance-session/types';
import { type CharacterProfile, type ProgressionState } from '@/src/lib/progression/types';
import { type FollowUpQuestionPlan } from '@/src/lib/recommendations/types';

interface OnboardingStateInput {
  routeOutcome?: GuidanceRouteOutcome;
  followUpQuestion?: FollowUpQuestionPlan;
  characterProfile?: CharacterProfile;
  progressionState?: ProgressionState;
}

export function planOnboardingState(input: OnboardingStateInput): GuidanceOnboardingState {
  if (!input.characterProfile?.intro) {
    return 'direct_next_step';
  }

  if (input.followUpQuestion) {
    return 'intro_plus_followup';
  }

  if (input.routeOutcome?.type === 'stay_in_guidance') {
    return 'intro_only';
  }

  if (input.progressionState?.readiness === 'ready') {
    return 'direct_next_step';
  }

  return 'intro_plus_next_step';
}
