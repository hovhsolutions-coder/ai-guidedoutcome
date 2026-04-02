import { createInitialGuidanceSessionStoreState, type GuidanceSessionStoreState } from '@/src/components/guidance/guidance-session-store';
import { createGuidancePresentationFixtureMatrix } from '@/tests/evals/guidance-presentation-fixtures';

export interface GuidanceInteractionFixture {
  id:
    | 'fresh_submit_loading'
    | 'clarifying_follow_up_loading'
    | 'trainer_request_loading'
    | 'execution_ready_dossier_loading';
  state: GuidanceSessionStoreState;
  liveRawInput: string;
}

export function createGuidanceInteractionFixtureMatrix(): GuidanceInteractionFixture[] {
  const presentationFixtures = createGuidancePresentationFixtureMatrix();
  const initialState = createInitialGuidanceSessionStoreState();
  const freshBase = presentationFixtures.find((fixture) => fixture.id === 'fresh');
  const clarifyingBase = presentationFixtures.find((fixture) => fixture.id === 'clarifying');
  const refinedBase = presentationFixtures.find((fixture) => fixture.id === 'refined_direction');
  const executionBase = presentationFixtures.find((fixture) => fixture.id === 'execution_ready');

  if (!freshBase || !clarifyingBase || !refinedBase || !executionBase) {
    throw new Error('Guidance presentation fixtures are incomplete.');
  }

  return [
    {
      id: 'fresh_submit_loading',
      state: {
        ...initialState,
        input: {
          ...initialState.input,
          rawInput: 'Need help with the rollout.',
        },
        feedback: {
          ...initialState.feedback,
          isLoading: true,
        },
      },
      liveRawInput: 'Need help with the rollout.',
    },
    {
      id: 'clarifying_follow_up_loading',
      state: {
        ...clarifyingBase.state,
        feedback: {
          ...clarifyingBase.state.feedback,
          isSubmittingFollowUp: true,
        },
      },
      liveRawInput: clarifyingBase.liveRawInput,
    },
    {
      id: 'trainer_request_loading',
      state: {
        ...refinedBase.state,
        session: {
          ...refinedBase.state.session,
          activeTrainer: refinedBase.state.session.guidanceSession?.trainerRecommendation?.topTrainer ?? null,
          trainerLoading: refinedBase.state.session.guidanceSession?.trainerRecommendation?.topTrainer ?? null,
        },
      },
      liveRawInput: refinedBase.liveRawInput,
    },
    {
      id: 'execution_ready_dossier_loading',
      state: executionBase.state,
      liveRawInput: executionBase.liveRawInput,
    },
  ];
}
