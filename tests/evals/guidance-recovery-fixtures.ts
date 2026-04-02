import { createInitialGuidanceSessionStoreState, type GuidanceSessionStoreState } from '@/src/components/guidance/guidance-session-store';
import { createGuidancePresentationFixtureMatrix } from '@/tests/evals/guidance-presentation-fixtures';

export interface GuidanceRecoveryFixture {
  id:
    | 'fresh_submit_failure'
    | 'clarifying_follow_up_failure'
    | 'trainer_request_failure'
    | 'execution_ready_dossier_failure';
  state: GuidanceSessionStoreState;
  liveRawInput: string;
}

export function createGuidanceRecoveryFixtureMatrix(): GuidanceRecoveryFixture[] {
  const presentationFixtures = createGuidancePresentationFixtureMatrix();
  const initialState = createInitialGuidanceSessionStoreState();
  const clarifyingBase = presentationFixtures.find((fixture) => fixture.id === 'clarifying');
  const refinedBase = presentationFixtures.find((fixture) => fixture.id === 'refined_direction');
  const executionBase = presentationFixtures.find((fixture) => fixture.id === 'execution_ready');

  if (!clarifyingBase || !refinedBase || !executionBase) {
    throw new Error('Guidance presentation fixtures are incomplete.');
  }

  return [
    {
      id: 'fresh_submit_failure',
      state: {
        ...initialState,
        input: {
          ...initialState.input,
          rawInput: 'Need help with the rollout.',
        },
        feedback: {
          ...initialState.feedback,
          error: 'Guidance could not be generated right now.',
        },
      },
      liveRawInput: 'Need help with the rollout.',
    },
    {
      id: 'clarifying_follow_up_failure',
      state: {
        ...clarifyingBase.state,
        feedback: {
          ...clarifyingBase.state.feedback,
          error: 'Guidance could not be generated right now.',
          isSubmittingFollowUp: false,
        },
      },
      liveRawInput: clarifyingBase.liveRawInput,
    },
    {
      id: 'trainer_request_failure',
      state: {
        ...refinedBase.state,
        session: {
          ...refinedBase.state.session,
          activeTrainer: refinedBase.state.session.guidanceSession?.trainerRecommendation?.topTrainer ?? null,
          trainerLoading: null,
          trainerError: 'Trainer guidance could not be generated.',
        },
      },
      liveRawInput: refinedBase.liveRawInput,
    },
    {
      id: 'execution_ready_dossier_failure',
      state: executionBase.state,
      liveRawInput: executionBase.liveRawInput,
    },
  ];
}
