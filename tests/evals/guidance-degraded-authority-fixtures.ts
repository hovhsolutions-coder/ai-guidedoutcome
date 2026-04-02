import { createGuidancePresentationFixtureMatrix } from '@/tests/evals/guidance-presentation-fixtures';
import { type GuidanceSessionStoreState } from '@/src/components/guidance/guidance-session-store';

export interface GuidanceDegradedAuthorityFixture {
  id:
    | 'result_without_guidance_session'
    | 'execution_phase_without_progression_snapshot'
    | 'clarifying_without_phase_ui_data'
    | 'trainer_response_without_recommendation';
  state: GuidanceSessionStoreState;
  liveRawInput: string;
}

export function createGuidanceDegradedAuthorityFixtureMatrix(): GuidanceDegradedAuthorityFixture[] {
  const baseFixtures = createGuidancePresentationFixtureMatrix();
  const clarifying = baseFixtures.find((fixture) => fixture.id === 'clarifying');
  const refined = baseFixtures.find((fixture) => fixture.id === 'refined_direction');
  const executionReady = baseFixtures.find((fixture) => fixture.id === 'execution_ready');

  if (!clarifying || !refined || !executionReady) {
    throw new Error('Guidance degraded-authority fixtures are incomplete.');
  }

  return [
    {
      id: 'result_without_guidance_session',
      state: {
        ...refined.state,
        session: {
          ...refined.state.session,
          guidanceSession: null,
          activeTrainer: null,
          trainerLoading: null,
          trainerError: null,
        },
      },
      liveRawInput: refined.liveRawInput,
    },
    {
      id: 'execution_phase_without_progression_snapshot',
      state: {
        ...executionReady.state,
        session: {
          ...executionReady.state.session,
          guidanceSession: executionReady.state.session.guidanceSession
            ? {
              ...executionReady.state.session.guidanceSession,
              progressionSnapshot: undefined,
            }
            : null,
        },
      },
      liveRawInput: executionReady.liveRawInput,
    },
    {
      id: 'clarifying_without_phase_ui_data',
      state: {
        ...clarifying.state,
        session: {
          ...clarifying.state.session,
          guidanceSession: clarifying.state.session.guidanceSession
            ? {
              ...clarifying.state.session.guidanceSession,
              onboardingState: undefined,
              progressionSnapshot: undefined,
              followUpQuestion: undefined,
            }
            : null,
        },
      },
      liveRawInput: clarifying.liveRawInput,
    },
    {
      id: 'trainer_response_without_recommendation',
      state: {
        ...refined.state,
        session: {
          ...refined.state.session,
          activeTrainer: 'strategy',
          guidanceSession: refined.state.session.guidanceSession
            ? {
              ...refined.state.session.guidanceSession,
              trainerRecommendation: undefined,
              trainerResponse: {
                trainer: 'strategy',
                focus_label: 'Strategic framing',
                headline: 'Hold the narrowed decision frame.',
                key_insight: 'The refined direction is good enough to move without reopening the whole read.',
                recommendation: 'Keep the partner decision narrow and resist adding new branches.',
                next_move: 'Compare the remaining partner options against the single approval risk.',
                support_points: ['Keep the criteria stable', 'Do not reopen resolved tradeoffs'],
                confidence_label: 'medium',
              },
            }
            : null,
        },
      },
      liveRawInput: refined.liveRawInput,
    },
  ];
}
