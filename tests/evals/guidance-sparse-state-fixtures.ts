import { createInitialGuidanceSessionStoreState, type GuidanceSessionStoreState } from '@/src/components/guidance/guidance-session-store';
import { createGuidancePresentationFixtureMatrix } from '@/tests/evals/guidance-presentation-fixtures';

export interface GuidanceSparseStateFixture {
  id:
    | 'refined_without_suggested_tasks'
    | 'result_with_minimal_continuation'
    | 'refined_without_trainer_surface'
    | 'execution_ready_without_optional_sections';
  state: GuidanceSessionStoreState;
  liveRawInput: string;
}

export function createGuidanceSparseStateFixtureMatrix(): GuidanceSparseStateFixture[] {
  // Use deep clones to avoid mutating shared fixture objects
  const baseFixtures = createGuidancePresentationFixtureMatrix();
  const initialState = createInitialGuidanceSessionStoreState();
  const refined = structuredClone(baseFixtures.find((fixture) => fixture.id === 'refined_direction'));
  const executionReady = structuredClone(baseFixtures.find((fixture) => fixture.id === 'execution_ready'));

  if (!refined || !executionReady) {
    throw new Error('Guidance sparse-state fixtures are incomplete.');
  }

  return [
    {
      id: 'refined_without_suggested_tasks',
      state: {
        ...refined.state,
        session: {
          ...refined.state.session,
          result: refined.state.session.result
            ? {
              ...refined.state.session.result,
              suggested_tasks: [],
            }
            : null,
          guidanceSession: refined.state.session.guidanceSession
            ? {
              ...refined.state.session.guidanceSession,
              result: refined.state.session.guidanceSession.result
                ? {
                  ...refined.state.session.guidanceSession.result,
                  suggestedTasks: [],
                }
                : refined.state.session.guidanceSession.result,
            }
            : null,
        },
      },
      liveRawInput: refined.liveRawInput,
    },
    {
      id: 'result_with_minimal_continuation',
      state: {
        ...initialState,
        input: {
          ...initialState.input,
          rawInput: 'Need a clear next move for the rollout.',
          situation: 'High-level release planning',
          mainGoal: 'Get one concrete next move',
        },
        session: {
          ...initialState.session,
          result: {
            summary: 'The direction is usable, but the continuation metadata is intentionally minimal here.',
            next_step: 'Lock the one decision that keeps the rollout moving',
            suggested_tasks: [],
          },
          resultMeta: {
            detectedDomain: 'planning',
            activeMode: 'planning',
            shouldOfferDossier: false,
          },
          guidanceSession: null,
        },
        meta: {
          ...initialState.meta,
          generationCount: 1,
          lastGeneratedAt: '3:20 PM',
        },
      },
      liveRawInput: 'Need a clear next move for the rollout.',
    },
    {
      id: 'refined_without_trainer_surface',
      state: {
        ...refined.state,
        session: {
          ...refined.state.session,
          activeTrainer: null,
          trainerLoading: null,
          trainerError: null,
          guidanceSession: refined.state.session.guidanceSession
            ? {
              ...refined.state.session.guidanceSession,
              trainerRecommendation: undefined,
              trainerResponse: undefined,
            }
            : null,
        },
      },
      liveRawInput: refined.liveRawInput,
    },
    {
      id: 'execution_ready_without_optional_sections',
      state: {
        ...executionReady.state,
        session: {
          ...executionReady.state.session,
          activeTrainer: null,
          trainerLoading: null,
          trainerError: null,
          guidanceSession: executionReady.state.session.guidanceSession
            ? {
              ...executionReady.state.session.guidanceSession,
              trainerRecommendation: undefined,
              trainerResponse: undefined,
              characterProfile: undefined,
              onboardingState: undefined,
            }
            : null,
        },
      },
      liveRawInput: executionReady.liveRawInput,
    },
  ];
}
