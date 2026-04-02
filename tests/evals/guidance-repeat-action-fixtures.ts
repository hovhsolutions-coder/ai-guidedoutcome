import { createGuidanceInteractionFixtureMatrix } from '@/tests/evals/guidance-interaction-fixtures';
import { type GuidanceSessionStoreState } from '@/src/components/guidance/guidance-session-store';

export interface GuidanceRepeatActionFixture {
  id:
    | 'repeat_fresh_submit'
    | 'repeat_clarifying_continue'
    | 'repeat_trainer_request'
    | 'repeat_execution_ready_dossier_convert';
  state: GuidanceSessionStoreState;
  liveRawInput: string;
}

export function createGuidanceRepeatActionFixtureMatrix(): GuidanceRepeatActionFixture[] {
  const interactionFixtures = createGuidanceInteractionFixtureMatrix();
  const fresh = interactionFixtures.find((fixture) => fixture.id === 'fresh_submit_loading');
  const clarifying = interactionFixtures.find((fixture) => fixture.id === 'clarifying_follow_up_loading');
  const trainer = interactionFixtures.find((fixture) => fixture.id === 'trainer_request_loading');
  const execution = interactionFixtures.find((fixture) => fixture.id === 'execution_ready_dossier_loading');

  if (!fresh || !clarifying || !trainer || !execution) {
    throw new Error('Guidance repeat-action fixtures are incomplete.');
  }

  return [
    {
      id: 'repeat_fresh_submit',
      state: fresh.state,
      liveRawInput: fresh.liveRawInput,
    },
    {
      id: 'repeat_clarifying_continue',
      state: clarifying.state,
      liveRawInput: clarifying.liveRawInput,
    },
    {
      id: 'repeat_trainer_request',
      state: trainer.state,
      liveRawInput: trainer.liveRawInput,
    },
    {
      id: 'repeat_execution_ready_dossier_convert',
      state: execution.state,
      liveRawInput: execution.liveRawInput,
    },
  ];
}
